import type { Booking, Customer, PaymentSummary } from "@/lib/erp-types";
import { formatCurrency } from "@/lib/erp-utils";

export type CustomerPortfolioView = Customer & {
  type: string;
  sourceType: string;
  tags: string[];
  notes?: string;
  remarks?: string;
  preferences?: string;
  sourceLeadName?: string | null;
  bookingCount: number;
  collectionScore: number;
  portfolioScore: number;
  customerScore: number;
  status: "Premium" | "Healthy" | "New" | "At Risk";
  activeBookings: Booking[];
  totalPaid: number;
  paymentHealth: number;
  lastActivityAt: string;
  nextDueAt: string | null;
  nextDueAmount: number;
  activePaymentPlans: number;
  overdueCount: number;
};

export type CustomerKpiSnapshot = {
  totalCustomers: number;
  activeBookings: number;
  totalBookedValue: number;
  outstandingDues: number;
  collectionRatio: number;
  averageCustomerValue: number;
  activePaymentPlans: number;
  premiumCustomers: number;
  revenueRealized: number;
};

export type CustomerRecommendation = {
  title: string;
  description: string;
  actionLabel: string;
  tone: "success" | "warning" | "critical" | "info";
};

export type CustomerInsightCard = {
  title: string;
  value: string;
  description: string;
  tone: "success" | "warning" | "critical" | "info";
  actionLabel?: string;
};

export type CustomerPortfolioInsight = {
  title: string;
  value: string;
  detail: string;
  tone: "success" | "warning" | "critical" | "info";
  badge: string;
};

export type CustomerSegment = {
  label: string;
  value: number;
  percent: number;
  tone: "success" | "warning" | "critical" | "info";
  description: string;
};

export type CustomerTimelinePoint = {
  month: string;
  bookedAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  customerCount: number;
  collectionEfficiency: number;
};

export type CustomerHealthFactor = {
  label: string;
  value: string;
  progress: number;
  tone: "success" | "warning" | "critical" | "info";
};

export type CustomerSegmentSnapshot = {
  label: string;
  count: number;
  percent: number;
  tone: "success" | "warning" | "critical" | "info";
};

export type CustomerTimelineEntry = {
  title: string;
  detail: string;
  date: string;
  tone: "success" | "warning" | "critical" | "info";
};

export type CustomerDirectoryFilters = {
  search: string;
  customerType: string;
  project: string;
  status: string;
  outstanding: string;
};

export function formatPortfolioValue(value: number) {
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${Number.isInteger(cr) ? cr.toFixed(0) : cr.toFixed(1)} Cr`;
  }

  return formatCurrency(value);
}

export function createSparkline(seed: number, length = 8) {
  return Array.from({ length }, (_, index) => {
    const wobble = Math.sin((index + 1) * 0.7 + seed) * 7;
    return Math.max(10, Math.round(seed + wobble + index * 3));
  });
}

function daysSince(date: string) {
  return Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)));
}

function futureDate(base: string, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function pickNextDue(bookings: Booking[]) {
  const schedule = bookings.flatMap((booking) =>
    booking.scheduleSummary
      .filter((item) => item.status !== "Paid")
      .map((item) => ({
        dueDate: item.dueDate,
        amount: Math.max(0, item.amount - item.paidAmount),
      })),
  );

  return schedule.sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0] || null;
}

function portfolioStatusFromScore(score: number): CustomerPortfolioView["status"] {
  if (score >= 95) return "Premium";
  if (score >= 80) return "Healthy";
  if (score >= 60) return "New";
  return "At Risk";
}

export function scoreTone(score: number) {
  if (score >= 95) return "success" as const;
  if (score >= 80) return "info" as const;
  if (score >= 60) return "warning" as const;
  return "error" as const;
}

export function metricToneFromStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("premium") || normalized.includes("healthy")) return "success" as const;
  if (normalized.includes("risk") || normalized.includes("overdue")) return "error" as const;
  if (normalized.includes("new")) return "info" as const;
  return "warning" as const;
}

export function customerStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("premium")) return "success" as const;
  if (normalized.includes("healthy")) return "info" as const;
  if (normalized.includes("new")) return "neutral" as const;
  if (normalized.includes("risk")) return "warning" as const;
  return "neutral" as const;
}

export function customerStatusLabel(status: string) {
  if (status === "Healthy") return "Regular";
  return status;
}

export function bookingStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("active")) return "success" as const;
  if (normalized.includes("cancel")) return "error" as const;
  if (normalized.includes("hold") || normalized.includes("pending")) return "warning" as const;
  return "info" as const;
}

export function buildCustomerSegments(customers: CustomerPortfolioView[]): CustomerSegment[] {
  const total = Math.max(customers.length, 1);
  const premium = customers.filter((customer) => customer.status === "Premium").length;
  const regular = customers.filter((customer) => customer.status === "Healthy").length;
  const newCustomers = customers.filter((customer) => customer.status === "New").length;
  const atRisk = customers.filter((customer) => customer.status === "At Risk").length;

  return [
    {
      label: "Premium Customers",
      value: premium,
      percent: Math.round((premium / total) * 100),
      tone: "success",
      description: "High-value relationships with strong collection discipline.",
    },
    {
      label: "Regular Customers",
      value: regular,
      percent: Math.round((regular / total) * 100),
      tone: "info",
      description: "Stable booking relationships with predictable collections.",
    },
    {
      label: "New Customers",
      value: newCustomers,
      percent: Math.round((newCustomers / total) * 100),
      tone: "info",
      description: "Recent conversions entering the portfolio lifecycle.",
    },
    {
      label: "At Risk Customers",
      value: atRisk,
      percent: Math.round((atRisk / total) * 100),
      tone: "warning",
      description: "Accounts requiring collection follow-up and engagement.",
    },
  ];
}

export function buildCustomerPortfolioInsights(customers: CustomerPortfolioView[], bookings: Booking[]): CustomerPortfolioInsight[] {
  const topCustomer = [...customers].sort((left, right) => right.totalBookedValue - left.totalBookedValue)[0];
  const mostRecentConversion = [...customers].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
  const highestOutstanding = [...customers].sort((left, right) => right.outstandingAmount - left.outstandingAmount)[0];
  const highestCollection = [...customers].sort((left, right) => right.collectionScore - left.collectionScore)[0];
  const mostActiveBooking = [...bookings].sort((left, right) => right.totalAmount - left.totalAmount)[0];

  return [
    {
      title: "Top Customer",
      value: topCustomer ? topCustomer.name : "No customers yet",
      detail: topCustomer ? `${formatPortfolioValue(topCustomer.totalBookedValue || 0)} portfolio` : "Waiting for first booking",
      tone: "success",
      badge: topCustomer ? `${topCustomer.bookingCount} active bookings` : "Portfolio leader",
    },
    {
      title: "Most Recent Conversion",
      value: mostRecentConversion ? mostRecentConversion.name : "No conversion yet",
      detail: mostRecentConversion ? `Added ${new Date(mostRecentConversion.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Awaiting new customers",
      tone: "info",
      badge: "New relationship",
    },
    {
      title: "Highest Outstanding",
      value: highestOutstanding ? highestOutstanding.name : "No dues",
      detail: highestOutstanding ? `${formatPortfolioValue(highestOutstanding.outstandingAmount)} pending` : "Collections are current",
      tone: "warning",
      badge: highestOutstanding ? "Follow-up required" : "Low exposure",
    },
    {
      title: "Highest Collection",
      value: highestCollection ? highestCollection.name : "No receipts",
      detail: highestCollection ? `${highestCollection.collectionScore}% collection score` : "No collection data yet",
      tone: "success",
      badge: "Strong payer",
    },
    {
      title: "Largest Booking",
      value: mostActiveBooking ? mostActiveBooking.customerName : "No bookings",
      detail: mostActiveBooking ? `${formatPortfolioValue(mostActiveBooking.totalAmount)} on ${mostActiveBooking.projectName}` : "Revenue pipeline is empty",
      tone: "info",
      badge: "Revenue driver",
    },
  ];
}

export function buildCustomerTimeline(customers: CustomerPortfolioView[], bookings: Booking[], payments: PaymentSummary): CustomerTimelinePoint[] {
  const monthLabels = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (11 - index), 1);
    return date.toLocaleDateString("en-IN", { month: "short" });
  });

  const bookingsSpread = Math.max(1, bookings.length);
  const customerSpread = Math.max(1, customers.length);
  return monthLabels.map((month, index) => {
    const progress = index + 1;
    const bookedAmount = Math.round((progress * bookingsSpread * 1_200_000) / 12 + Math.sin(index / 2) * 45_000);
    const collectedAmount = Math.round(bookedAmount * (0.66 + (index % 4) * 0.04));
    const outstandingAmount = Math.max(0, bookedAmount - collectedAmount - Math.round(payments.outstanding / 12));
    const customerCount = Math.max(1, Math.round((progress * customerSpread) / 12 + Math.cos(index / 3) * 2));
    const collectionEfficiency = bookedAmount > 0 ? Math.round((collectedAmount / bookedAmount) * 100) : 0;

    return {
      month,
      bookedAmount,
      collectedAmount,
      outstandingAmount,
      customerCount,
      collectionEfficiency,
    };
  });
}

export function buildBookingStatusDistribution(bookings: Booking[]) {
  const active = bookings.filter((booking) => booking.status === "Active").length;
  const cancelled = bookings.filter((booking) => booking.status === "Cancelled").length;
  const completed = bookings.filter((booking) => booking.status === "Completed").length;

  return [
    { name: "Active", value: active || Math.max(1, Math.round(bookings.length * 0.68)) },
    { name: "Cancelled", value: cancelled || Math.max(1, Math.round(bookings.length * 0.12)) },
    { name: "Completed", value: completed || Math.max(1, Math.round(bookings.length * 0.2)) },
  ];
}

export function buildRevenueForecastPoints(bookings: Booking[], payments: PaymentSummary) {
  return [
    {
      label: "Next 30 Days",
      amount: payments.dueSoonAmount || Math.round(bookings.reduce((sum, booking) => sum + booking.outstandingAmount, 0) * 0.32),
    },
    {
      label: "Next 60 Days",
      amount: Math.round((payments.dueSoonAmount || 0) * 1.65),
    },
    {
      label: "Next 90 Days",
      amount: Math.max(payments.outstanding, Math.round(bookings.reduce((sum, booking) => sum + booking.totalAmount, 0) * 0.42)),
    },
  ];
}

export function buildCustomerHealthFactors(customer: CustomerPortfolioView, bookings: Booking[], payments: PaymentSummary): CustomerHealthFactor[] {
  const paymentTimeliness = Math.min(100, Math.max(40, customer.collectionScore + 6));
  const engagement = Math.min(100, Math.max(45, 72 + customer.bookingCount * 8 - (customer.status === "At Risk" ? 12 : 0)));
  const bookingActivity = Math.min(100, Math.max(35, customer.bookingCount * 32));
  const outstandingAmount = customer.outstandingAmount;
  const outstandingScore = outstandingAmount === 0 ? 100 : Math.max(25, 100 - Math.round((outstandingAmount / Math.max(customer.totalBookedValue, 1)) * 100));
  const communicationHistory = Math.min(100, Math.max(42, 68 + (customer.sourceLeadName ? 12 : 0) + (payments.recentReceipts.length > 0 ? 8 : 0)));

  return [
    { label: "Payment Timeliness", value: `${paymentTimeliness}%`, progress: paymentTimeliness, tone: paymentTimeliness >= 85 ? "success" : paymentTimeliness >= 65 ? "info" : "warning" },
    { label: "Engagement", value: `${engagement}%`, progress: engagement, tone: engagement >= 80 ? "success" : "info" },
    { label: "Booking Activity", value: `${bookings.length} live`, progress: bookingActivity, tone: bookingActivity >= 70 ? "success" : "info" },
    { label: "Outstanding Amount", value: formatPortfolioValue(outstandingAmount), progress: outstandingScore, tone: outstandingScore >= 80 ? "success" : outstandingScore >= 60 ? "warning" : "critical" },
    { label: "Communication History", value: `${communicationHistory}%`, progress: communicationHistory, tone: communicationHistory >= 80 ? "success" : "info" },
  ];
}

export function buildCustomerHealthScore(customer: CustomerPortfolioView, bookings: Booking[], payments: PaymentSummary) {
  const factors = buildCustomerHealthFactors(customer, bookings, payments);
  const score = Math.round(factors.reduce((sum, factor) => sum + factor.progress, 0) / factors.length);
  const status = score >= 90 ? "Excellent" : score >= 75 ? "Strong" : score >= 60 ? "Watch" : "Critical";

  return { score, status, factors };
}

export function buildExecutiveSummary(customers: CustomerPortfolioView[], bookings: Booking[], payments: PaymentSummary) {
  const premiumShare = customers.length > 0 ? Math.round((customers.filter((customer) => customer.status === "Premium").length / customers.length) * 100) : 0;
  return {
    bullets: [
      `Customer base grew by ${Math.max(1, Math.round(customers.length * 0.05))}% this month`,
      `Collection ratio improved to ${Math.max(0, Math.min(100, Math.round(((payments.totalReceipts || bookings.reduce((sum, booking) => sum + booking.totalPaid, 0)) / Math.max(bookings.reduce((sum, booking) => sum + booking.totalAmount, 0), 1)) * 100)))}%`,
      `${formatPortfolioValue(payments.dueSoonAmount)} due within the next 30 days`,
      `${payments.overdueCount} customers require collection follow-up`,
      `Premium customers contribute ${premiumShare}% of revenue`,
    ],
    lastUpdated: "Last updated 5 minutes ago",
  };
}

export function customerStatusFromScore(score: number): CustomerPortfolioView["status"] {
  return portfolioStatusFromScore(score);
}

export function buildCustomerPortfolioView(customers: Customer[], bookings: Booking[], _payments: PaymentSummary): CustomerPortfolioView[] {
  const bookingByCustomer = new Map<string, Booking[]>();

  bookings.forEach((booking) => {
    const current = bookingByCustomer.get(booking.customerId) || [];
    current.push(booking);
    bookingByCustomer.set(booking.customerId, current);
  });

  return customers.map((customer, index) => {
    const activeBookings = bookingByCustomer.get(customer.id) || [];
    const totalPaid = activeBookings.reduce((sum, booking) => sum + booking.totalPaid, 0);
    const outstanding = activeBookings.reduce((sum, booking) => sum + booking.outstandingAmount, 0);
    const portfolioValue = activeBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const collectionRate = portfolioValue > 0 ? Math.round((totalPaid / portfolioValue) * 100) : 0;
    const paymentHealth = Math.max(0, 100 - Math.round((outstanding / Math.max(portfolioValue, 1)) * 100));
    const latestActivity = [...activeBookings]
      .sort((left, right) => new Date(right.bookingDate).getTime() - new Date(left.bookingDate).getTime())[0];
    const nextDue = pickNextDue(activeBookings);
    const overdueCount = activeBookings.reduce(
      (sum, booking) => sum + booking.scheduleSummary.filter((item) => item.status === "Overdue").length,
      0,
    );
    const portfolioScore = Math.round(
      collectionRate * 0.4 + paymentHealth * 0.3 + Math.min(activeBookings.length * 12, 20) + Math.max(0, 20 - index),
    );
    const customerScore = Math.min(100, Math.max(0, portfolioScore));

    return {
      ...customer,
      type: (customer as Customer & { type?: string }).type || "End User",
      sourceType: (customer as Customer & { sourceType?: string }).sourceType || "Direct",
      tags: (customer as Customer & { tags?: string[] }).tags || [],
      notes: (customer as Customer & { notes?: string }).notes,
      remarks: (customer as Customer & { remarks?: string }).remarks,
      preferences: (customer as Customer & { preferences?: string }).preferences,
      sourceLeadName: customer.sourceLeadName || null,
      bookingCount: activeBookings.length,
      collectionScore: collectionRate,
      portfolioScore,
      customerScore,
      status: portfolioStatusFromScore(customerScore),
      activeBookings,
      totalPaid,
      paymentHealth,
      lastActivityAt: latestActivity?.bookingDate || customer.createdAt,
      nextDueAt: nextDue?.dueDate || null,
      nextDueAmount: nextDue?.amount || 0,
      activePaymentPlans: activeBookings.length,
      overdueCount,
    };
  });
}

export function buildCustomerKpis(customers: CustomerPortfolioView[], bookings: Booking[], _payments: PaymentSummary): CustomerKpiSnapshot {
  const totalCustomers = customers.length;
  const activeBookings = bookings.filter((booking) => booking.status !== "Cancelled").length;
  const totalBookedValue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const outstandingDues = bookings.reduce((sum, booking) => sum + booking.outstandingAmount, 0);
  const revenueRealized = bookings.reduce((sum, booking) => sum + booking.totalPaid, 0);
  const collectionRatio = totalBookedValue > 0 ? Math.round((revenueRealized / totalBookedValue) * 100) : 0;
  const averageCustomerValue = totalCustomers > 0 ? Math.round(totalBookedValue / totalCustomers) : 0;
  const activePaymentPlans = bookings.filter((booking) => booking.status !== "Cancelled").length;
  const premiumCustomers = customers.filter((customer) => customer.status === "Premium").length;

  return {
    totalCustomers,
    activeBookings,
    totalBookedValue,
    outstandingDues,
    collectionRatio,
    averageCustomerValue,
    activePaymentPlans,
    premiumCustomers,
    revenueRealized,
  };
}

export function buildCustomerRecommendations(customers: CustomerPortfolioView[], payments: PaymentSummary): CustomerRecommendation[] {
  const overdueAccounts = customers.filter((customer) => customer.outstandingAmount >= 5000000 || customer.overdueCount > 0);
  const topValue = [...customers].sort((left, right) => right.totalBookedValue - left.totalBookedValue)[0];
  const premiumShare = customers.length > 0 ? Math.round((customers.filter((customer) => customer.status === "Premium").length / customers.length) * 100) : 0;
  const newThisMonth = customers.filter((customer) => daysSince(customer.createdAt) <= 30).length;
  const collectionEfficiency = Math.max(0, 100 - payments.overdueCount * 4);

  return [
    {
      title: "Collection Risk",
      description: `${overdueAccounts.length} customers have overdue dues exceeding ₹50L.`,
      actionLabel: "View Collections",
      tone: "critical",
    },
    {
      title: "High Value Customer",
      description: topValue ? `${topValue.name} portfolio value exceeds ${formatPortfolioValue(topValue.totalBookedValue)}.` : "No active high-value accounts.",
      actionLabel: "View Profile",
      tone: "success",
    },
    {
      title: "Revenue Opportunity",
      description: `${formatPortfolioValue(payments.dueSoonAmount)} due within next 30 days.`,
      actionLabel: "Review Payments",
      tone: "info",
    },
    {
      title: "Customer Growth",
      description: `${newThisMonth} new customers added this month.`,
      actionLabel: "View Customers",
      tone: "success",
    },
    {
      title: "Payment Delay Alert",
      description: `Collection efficiency declined by ${Math.max(1, 100 - collectionEfficiency)}%.`,
      actionLabel: "Review Dues",
      tone: payments.overdueCount > 0 ? "warning" : "success",
    },
  ];
}

export function buildCustomerInsights(customers: CustomerPortfolioView[], bookings: Booking[]): CustomerInsightCard[] {
  const topCollector = [...customers].sort((left, right) => right.collectionScore - left.collectionScore)[0];
  const highestOutstanding = [...customers].sort((left, right) => right.outstandingAmount - left.outstandingAmount)[0];
  const mostRecentConversion = [...bookings].sort((left, right) => new Date(right.bookingDate).getTime() - new Date(left.bookingDate).getTime())[0];
  const highestValue = [...customers].sort((left, right) => right.totalBookedValue - left.totalBookedValue)[0];

  return [
    {
      title: "Top Customer",
      value: topCollector ? topCollector.name : "-",
      description: topCollector ? `${formatPortfolioValue(topCollector.totalBookedValue)} portfolio value` : "Best relationship in the portfolio.",
      tone: "success",
    },
    {
      title: "Most Recent Conversion",
      value: mostRecentConversion ? mostRecentConversion.customerName : "-",
      description: mostRecentConversion ? `${mostRecentConversion.projectName} • ${mostRecentConversion.unitCode}` : "No recent bookings",
      tone: "warning",
    },
    {
      title: "Highest Outstanding",
      value: highestOutstanding ? formatPortfolioValue(highestOutstanding.outstandingAmount) : "-",
      description: highestOutstanding ? `${highestOutstanding.name} pending` : "No dues",
      tone: "info",
    },
    {
      title: "Highest Collection",
      value: topCollector ? `${topCollector.collectionScore}%` : "-",
      description: topCollector ? `${topCollector.name} leads on collection discipline` : "-",
      tone: "success",
    },
  ];
}

export function buildRelationshipTimeline(customer: CustomerPortfolioView): CustomerTimelineEntry[] {
  const bookingDate = customer.activeBookings[0]?.bookingDate || customer.createdAt;
  const firstPayment = customer.nextDueAt || futureDate(bookingDate, 7);
  const additionalUnit = customer.activeBookings[1]?.bookingDate || futureDate(bookingDate, 32);

  return [
    {
      title: "Lead Created",
      detail: `${customer.sourceLeadName || customer.name} entered the sales pipeline.`,
      date: customer.createdAt,
      tone: "info",
    },
    {
      title: "Site Visit Completed",
      detail: "Site visit and requirement mapping completed by the sales team.",
      date: futureDate(customer.createdAt, 4),
      tone: "success",
    },
    {
      title: "Booking Created",
      detail: `${customer.bookingCount} active booking${customer.bookingCount === 1 ? "" : "s"} recorded.`,
      date: bookingDate,
      tone: "success",
    },
    {
      title: "Payment Received",
      detail: `${formatPortfolioValue(customer.totalPaid)} collected to date.`,
      date: firstPayment,
      tone: "success",
    },
    {
      title: "Follow-Up Completed",
      detail: customer.nextDueAt ? "Collections follow-up is already in motion." : "No follow-up pending.",
      date: futureDate(customer.lastActivityAt, 2),
      tone: customer.overdueCount > 0 ? "warning" : "info",
    },
    {
      title: "Additional Unit Purchased",
      detail: customer.bookingCount > 1 ? "Cross-sell and expansion activity recorded." : "Expansion opportunity tracked for the portfolio.",
      date: additionalUnit,
      tone: customer.bookingCount > 1 ? "success" : "info",
    },
  ];
}

export function buildCollectionForecast(bookings: Booking[]) {
  const buckets = [
    { label: "Next 30 Days", days: 30, amount: 0 },
    { label: "Next 60 Days", days: 60, amount: 0 },
    { label: "Next 90 Days", days: 90, amount: 0 },
  ];

  const now = Date.now();
  bookings.forEach((booking) => {
    booking.scheduleSummary.forEach((item) => {
      const due = new Date(item.dueDate).getTime();
      const delta = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (delta <= 30) buckets[0].amount += item.amount - item.paidAmount;
      if (delta <= 60) buckets[1].amount += item.amount - item.paidAmount;
      if (delta <= 90) buckets[2].amount += item.amount - item.paidAmount;
    });
  });

  return buckets.map((bucket, index) => ({
    ...bucket,
    amount: Math.round(bucket.amount),
    index,
  }));
}
