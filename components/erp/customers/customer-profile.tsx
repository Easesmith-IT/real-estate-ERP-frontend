"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit2,
  CreditCard,
  Bell,
  Plus,
  Building2,
  Wallet,
  Percent,
  User,
  History,
  MessageSquare,
  FileText,
  Activity,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/erp-utils";
import { formatPortfolioValue, buildCustomerPortfolioView, buildRelationshipTimeline } from "./customer-utils";
import { CustomerResponse, BookingResponse, PaymentSummary } from "@/lib/erp-types";

type Props = { customerId: string };

const staticNow = Date.now();

const addDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export function CustomerProfile({ customerId }: Props) {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "profile" | "bookings" | "payments" | "collections" | "communication" | "documents" | "timeline"
  >("profile");

  const customersQuery = useQuery({
    queryKey: ["erp-customers", role],
    queryFn: async () => (await apiRequest<CustomerResponse>("/api/customers", { role })).data,
  });
  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });
  const paymentsQuery = useQuery({
    queryKey: ["erp-payments-summary", role],
    queryFn: async () => (await apiRequest<PaymentSummary>("/api/payments/summary", { role })).data,
  });

  const profile = useMemo(() => {
    if (!customersQuery.data || !bookingsQuery.data || !paymentsQuery.data) return null;
    const customers = buildCustomerPortfolioView(
      customersQuery.data.customers || [],
      bookingsQuery.data.bookings || [],
      paymentsQuery.data
    );
    return customers.find((customer) => customer.id === customerId) || null;
  }, [customersQuery.data, bookingsQuery.data, paymentsQuery.data, customerId]);

  const reminderMutation = useMutation({
    mutationFn: async () => Promise.resolve(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-customers"] });
    },
  });

  const timelineData = useMemo(() => {
    if (!profile) return [];
    return buildRelationshipTimeline(profile);
  }, [profile]);

  const mockCommunications = useMemo(() => {
    if (!profile) return [];
    return [
      {
        date: formatDate(profile.createdAt),
        type: "System Alert",
        details: "Welcome kit and relationship roadmap sent to customer email.",
        channel: "Email",
        status: "Delivered",
      },
      {
        date: formatDate(addDays(profile.createdAt, 4)),
        type: "Sales Call",
        details: "Site visit follow-up and configuration preference verification.",
        channel: "Voice Call",
        status: "Completed",
      },
      {
        date: formatDate(profile.activeBookings[0]?.bookingDate || profile.createdAt),
        type: "Demand Letter",
        details: "Booking milestone demand letter and payment link dispatched.",
        channel: "WhatsApp",
        status: "Read",
      },
      {
        date: formatDate(addDays(profile.lastActivityAt, 1)),
        type: "Collection Reminder",
        details: "Automated alert for upcoming due installment.",
        channel: "SMS",
        status: "Sent",
      },
    ];
  }, [profile]);

  const mockDocuments = useMemo(() => {
    if (!profile) return [];
    return [
      {
        name: "KYC_Dossier_Verified.pdf",
        size: "2.4 MB",
        type: "Identity Verification",
        uploadedAt: formatDate(profile.createdAt),
      },
      {
        name: `Booking_Agreement_${profile.name.replace(/\s+/g, "_")}.pdf`,
        size: "4.8 MB",
        type: "Legal Agreement",
        uploadedAt: formatDate(profile.activeBookings[0]?.bookingDate || profile.createdAt),
      },
      {
        name: "Token_Receipt_Signed.pdf",
        size: "1.1 MB",
        type: "Payment Receipt",
        uploadedAt: formatDate(profile.activeBookings[0]?.bookingDate || profile.createdAt),
      },
      {
        name: "Unit_Allotment_Letter.pdf",
        size: "1.8 MB",
        type: "Allotment Letter",
        uploadedAt: formatDate(addDays(profile.createdAt, 10)),
      },
    ];
  }, [profile]);

  const allSchedules = useMemo(() => {
    if (!profile) return [];
    return profile.activeBookings.flatMap((b) =>
      b.scheduleSummary.map((s) => ({
        ...s,
        bookingId: b.id,
        projectName: b.projectName,
        unitCode: b.unitCode,
      }))
    );
  }, [profile]);

  if (customersQuery.isLoading || bookingsQuery.isLoading || paymentsQuery.isLoading) {
    return <LoadingStateCard title="Loading customer portfolio" />;
  }
  if (customersQuery.error || bookingsQuery.error || paymentsQuery.error || !profile) {
    return <ErrorStateCard message="Customer profile could not be loaded." />;
  }

  const statusTone: "success" | "info" | "warning" | "neutral" =
    profile.status === "Premium" ? "success" : profile.status === "Healthy" ? "info" : profile.status === "At Risk" ? "warning" : "neutral";

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "bookings" as const, label: "Bookings", icon: Building2 },
    { id: "payments" as const, label: "Payments", icon: CreditCard },
    { id: "collections" as const, label: "Collections", icon: History },
    { id: "communication" as const, label: "Communications", icon: MessageSquare },
    { id: "documents" as const, label: "Documents", icon: FileText },
    { id: "timeline" as const, label: "Timeline", icon: Activity },
  ];

  return (
    <section className="space-y-6 pb-12">
      {/* Back action */}
      <div className="flex items-center gap-2">
        <Link href="/sales/customers">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border-strong text-text-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Customer Relationship Center
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden border-border-soft/80 bg-linear-to-br from-surface to-surface-secondary shadow-soft">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-2xl font-bold text-accent-primary">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-page-title font-secondary text-surface leading-tight">{profile.name}</h1>
                <Badge tone={statusTone}>{profile.status === "Healthy" ? "Regular" : profile.status}</Badge>
                <Badge tone="info">{profile.type}</Badge>
              </div>
              <p className="text-body text-text-secondary">
                {profile.phone} • {profile.email || "No email"} • Relationship since {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4" /> Edit Profile
            </Button>
            <Button variant="secondary" size="sm">
              <Plus className="h-4 w-4" /> Add Booking
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={reminderMutation.isPending}
              onClick={() => reminderMutation.mutate()}
            >
              <Bell className="h-4 w-4" /> Send Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ProfileStat label="Units Owned" value={`${profile.activeBookings.length}`} icon={Building2} tone="info" />
        <ProfileStat label="Portfolio Value" value={formatPortfolioValue(profile.totalBookedValue || 0)} icon={Wallet} tone="info" />
        <ProfileStat label="Outstanding" value={formatPortfolioValue(profile.outstandingAmount || 0)} icon={Wallet} tone={profile.outstandingAmount > 0 ? "warning" : "success"} />
        <ProfileStat label="Collection Ratio" value={`${profile.collectionScore}%`} icon={Percent} tone={profile.collectionScore >= 80 ? "success" : "warning"} />
        <ProfileStat label="Health Score" value={`${profile.customerScore}`} icon={ShieldCheck} tone={profile.customerScore >= 85 ? "success" : "warning"} />
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-border-soft flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-body font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:border-border-soft hover:text-text-primary"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content area */}
      <div className="mt-6">
        {/* PROFILE INFORMATION */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2 overflow-hidden border-border-soft/80 bg-surface shadow-soft">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-body text-text-secondary">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailRow label="Full Name" value={profile.name} />
                  <DetailRow label="Customer Type" value={profile.type} />
                  <DetailRow label="Phone Number" value={profile.phone} />
                  <DetailRow label="Email Address" value={profile.email || "No email registered"} />
                  <DetailRow label="Acquisition Source" value={profile.sourceType} />
                  <DetailRow label="Associated Lead" value={profile.sourceLeadName || "Direct / No Lead"} />
                  <DetailRow label="Customer Score" value={`${profile.customerScore} / 100`} />
                  <DetailRow label="Portfolio Rating" value={profile.status === "Healthy" ? "Regular" : profile.status} />
                </div>
                <div className="border-t border-border-soft pt-4">
                  <p className="font-semibold text-text-primary mb-1">Customer Notes</p>
                  <p className="text-body bg-surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft">
                    {profile.notes || "No additional notes logged for this customer."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
              <CardHeader>
                <CardTitle>Preferences & Remarks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-label uppercase tracking-wider text-text-muted mb-1">Property Preferences</p>
                  <p className="text-body text-text-primary bg-surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft">
                    {profile.preferences || "No preferences defined."}
                  </p>
                </div>
                <div>
                  <p className="text-label uppercase tracking-wider text-text-muted mb-1">Internal Remarks</p>
                  <p className="text-body text-text-primary bg-surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft">
                    {profile.remarks || "No internal remarks logged."}
                  </p>
                </div>
                <div>
                  <p className="text-label uppercase tracking-wider text-text-muted mb-2">Relationship Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tags.length > 0 ? (
                      profile.tags.map((tag) => (
                        <Badge key={tag} tone="neutral">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-body text-text-muted">No tags associated</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* BOOKING HISTORY */}
        {activeTab === "bookings" && (
          <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle>Booking Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profile.activeBookings.map((booking) => {
                const paidPercent = booking.totalAmount > 0
                  ? Math.min(100, Math.round((booking.totalPaid / booking.totalAmount) * 100))
                  : 0;

                return (
                  <div key={booking.id} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-card-title font-semibold text-text-primary">{booking.projectName}</p>
                        <p className="text-label text-text-muted">Unit {booking.unitCode} • {booking.paymentPlanType}</p>
                      </div>
                      <Badge tone={booking.status === "Active" ? "success" : "neutral"}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-body">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Booking Value</span>
                        <span className="font-semibold text-text-primary">{formatPortfolioValue(booking.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Collected Total</span>
                        <span className="font-medium text-success">{formatPortfolioValue(booking.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Outstanding</span>
                        <span className="font-medium text-warning">{formatPortfolioValue(booking.outstandingAmount)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border-soft">
                      <div className="flex justify-between text-label">
                        <span className="text-text-secondary">Collection Rate</span>
                        <span className="font-semibold text-accent-primary">{paidPercent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-hover">
                        <div className="h-full bg-accent-primary" style={{ width: `${paidPercent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {profile.activeBookings.length === 0 && (
                <div className="col-span-full py-8 text-center text-text-secondary">
                  No active bookings registered in portfolio.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PAYMENT ACTIVITY */}
        {activeTab === "payments" && (
          <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle>Milestone Payment Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-[var(--radius-card)] border border-border-soft">
                <table className="w-full text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-11 border-b border-border-soft text-left">
                      <th className="px-4">Milestone</th>
                      <th className="px-4">Project / Unit</th>
                      <th className="px-4">Amount</th>
                      <th className="px-4">Due Date</th>
                      <th className="px-4">Paid Amount</th>
                      <th className="px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSchedules.map((schedule) => {
                      const isOverdue =
                        schedule.status === "Overdue" ||
                        (schedule.status !== "Paid" && staticNow > 0 && new Date(schedule.dueDate).getTime() < staticNow);
                      return (
                        <tr key={schedule.id} className="border-t border-border-soft hover:bg-hover">
                          <td className="px-4 py-3 font-medium text-text-primary">{schedule.label}</td>
                          <td className="px-4 py-3 text-text-secondary">
                            {schedule.projectName} ({schedule.unitCode})
                          </td>
                          <td className="px-4 py-3 text-text-primary">{formatPortfolioValue(schedule.amount)}</td>
                          <td className="px-4 py-3 text-text-secondary">
                            {new Date(schedule.dueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-success font-medium">
                            {formatPortfolioValue(schedule.paidAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={schedule.status === "Paid" ? "success" : isOverdue ? "error" : "warning"}>
                              {schedule.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {allSchedules.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                          No payment milestones mapped.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* COLLECTION HISTORY */}
        {activeTab === "collections" && (
          <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle>Collections Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-[var(--radius-card)] border border-border-soft">
                <table className="w-full text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-11 border-b border-border-soft text-left">
                      <th className="px-4">Receipt Milestone</th>
                      <th className="px-4">Project / Unit</th>
                      <th className="px-4">Amount Cleared</th>
                      <th className="px-4">Settled Date</th>
                      <th className="px-4">Method</th>
                      <th className="px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSchedules
                      .filter((s) => s.status === "Paid" || s.paidAmount > 0)
                      .map((schedule) => (
                        <tr key={schedule.id} className="border-t border-border-soft hover:bg-hover">
                          <td className="px-4 py-3 font-medium text-text-primary">{schedule.label}</td>
                          <td className="px-4 py-3 text-text-secondary">
                            {schedule.projectName} ({schedule.unitCode})
                          </td>
                          <td className="px-4 py-3 text-success font-medium">
                            {formatPortfolioValue(schedule.paidAmount)}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {new Date(schedule.dueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">Bank Transfer</td>
                          <td className="px-4 py-3">
                            <Badge tone="success">Cleared</Badge>
                          </td>
                        </tr>
                      ))}
                    {allSchedules.filter((s) => s.status === "Paid" || s.paidAmount > 0).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                          No cleared receipts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* COMMUNICATION HISTORY */}
        {activeTab === "communication" && (
          <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle>Customer Interaction Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCommunications.map((comm, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-text-primary text-body">{comm.type}</span>
                          <span className="text-text-muted text-label">•</span>
                          <Badge tone="neutral">{comm.channel}</Badge>
                        </div>
                        <p className="text-body text-text-secondary mt-1">{comm.details}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-label text-text-secondary font-medium">{comm.date}</p>
                      <Badge tone="success" className="mt-1">
                        {comm.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle>Customer Document Vault</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {mockDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary hover:bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10 text-error">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary text-body line-clamp-1">{doc.name}</p>
                        <p className="text-label text-text-secondary">
                          {doc.type} • {doc.size} • {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full border-border-strong text-text-secondary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* RELATIONSHIP TIMELINE */}
        {activeTab === "timeline" && (
          <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
            <CardHeader>
              <CardTitle>Relationship Lifecycle Timeline</CardTitle>
            </CardHeader>
            <CardContent className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-soft">
              {timelineData.map((event, idx) => {
                const isCheck = event.tone === "success";
                const isAlert = event.tone === "warning" || event.tone === "critical";

                return (
                  <div key={idx} className="relative space-y-1.5">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface shadow-soft ${
                        isCheck
                          ? "bg-success text-surface"
                          : isAlert
                          ? "bg-warning text-surface"
                          : "bg-accent-primary text-surface"
                      }`}
                    >
                      {isCheck ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isAlert ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <p className="font-semibold text-text-primary text-body">{event.title}</p>
                      <p className="text-label text-text-muted font-medium">
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <p className="text-body text-text-secondary bg-surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft">
                      {event.detail}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

function ProfileStat({
  label,
  value,
  icon: Icon,
  tone = "info" as const,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "info" | "warning" | "success";
}) {
  return (
    <Card className="card-kpi border-border-soft/80 bg-surface shadow-soft">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-secondary text-accent-primary">
            <Icon className="h-5 w-5" />
          </div>
          <Badge tone={tone}>{label}</Badge>
        </div>
        <p className="text-kpi-value text-text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border-soft pb-2">
      <p className="text-label text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-body font-semibold text-text-primary mt-0.5">{value}</p>
    </div>
  );
}
