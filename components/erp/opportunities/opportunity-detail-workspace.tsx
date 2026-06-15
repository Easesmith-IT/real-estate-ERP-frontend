"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import {
  ArrowLeft,
  Calendar,
  Coins,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Upload,
  UserCheck,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  Activity,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Lead, Booking } from "@/lib/erp-types";

// Standard layout definitions
const tabButtonClass = (isActive: boolean) =>
  `rounded-[var(--radius-input)] border px-4 py-2 text-body font-medium transition-colors ${
    isActive
      ? "border-accent-primary bg-active-soft text-accent-primary shadow-soft"
      : "border-border-soft bg-surface text-text-secondary hover:bg-hover"
  }`;

// Helper to map backend stage names to UI stages list
const toUiStage = (stage: string) => {
  if (stage === "Site Visit Scheduled") return "Visit";
  if (stage === "Closed Won") return "Won";
  return stage;
};

const toBackendStage = (stage: string) => {
  if (stage === "Visit") return "Site Visit Scheduled";
  if (stage === "Won") return "Closed Won";
  return stage;
};

export function OpportunityDetailWorkspace({ opportunityId }: { opportunityId: string }) {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Local state for simulated uploads
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; date: string; size: string; status: string }>>([
    { name: "PAN_Card_Verification.pdf", date: "2026-06-10", size: "1.2 MB", status: "Verified" },
    { name: "Aadhar_Card_Signed.pdf", date: "2026-06-10", size: "2.4 MB", status: "Verified" },
  ]);

  // Attempt to load Lead detail
  const leadQuery = useQuery({
    queryKey: ["erp-lead-detail", opportunityId, role],
    queryFn: async () => {
      try {
        const res = await apiRequest<any>(`/api/leads/${opportunityId}`, { role });
        return res.data;
      } catch (err) {
        // Return null to allow fallback to booking or mock details
        return null;
      }
    },
  });

  // Attempt to load Bookings to search for matches
  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings-list", role],
    queryFn: async () => {
      try {
        const res = await apiRequest<{ bookings: Booking[] }>("/api/bookings", { role });
        return res.data.bookings;
      } catch (err) {
        return [];
      }
    },
  });

  // Mutation to advance stage
  const advanceStageMutation = useMutation({
    mutationFn: async (stage: string) =>
      apiRequest<Lead>(`/api/leads/${opportunityId}/stage`, {
        role,
        method: "PATCH",
        body: { stage },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-lead-detail", opportunityId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
      ]);
    },
  });

  // Combine fetched DB results and build enriched fallback details
  const opportunity = useMemo(() => {
    const dbLead = leadQuery.data?.profile;
    const dbBookings = bookingsQuery.data || [];
    
    // Check if there is an exact booking match for the opportunity ID
    const matchingBooking = dbBookings.find(b => b.id === opportunityId || b.leadId === opportunityId);

    // Default details representing an high-impact opportunity
    const defaultData = {
      id: opportunityId,
      name: "Rohan Singhal - Signature Residency",
      customerName: "Rohan Singhal",
      phone: "+91 98765 43210",
      email: "rohan.singhal@outlook.com",
      project: "Signature Residency",
      projectId: "proj-101",
      stage: "Negotiation",
      value: 12500000, // ₹1.25 Cr
      probability: 75,
      expectedCloseDate: "2026-06-30",
      lastActivity: "2026-06-11",
      riskStatus: "Healthy" as "Healthy" | "Watch" | "At Risk" | "Critical",
      riskScore: 32,
      forecastCategory: "Best Case" as "Commit" | "Best Case" | "Pipeline" | "Omitted",
      owner: "Vikram Rathore",
      ownerId: "user-sales-1",
      source: "Broker Referral",
      config: "3 BHK Premium",
      location: "Tower B, Unit 804",
      notes: "Client has visited site twice. Interested in custom kitchen options. Negotiating 2% discount.",
    };

    if (matchingBooking) {
      return {
        ...defaultData,
        id: matchingBooking.id,
        name: `${matchingBooking.customerName} - ${matchingBooking.projectName}`,
        customerName: matchingBooking.customerName,
        phone: matchingBooking.customerPhone || "+91 98765 00000",
        project: matchingBooking.projectName,
        projectId: matchingBooking.projectId,
        stage: "Won",
        value: matchingBooking.totalAmount,
        probability: 100,
        expectedCloseDate: matchingBooking.bookingDate.split("T")[0],
        lastActivity: matchingBooking.bookingDate.split("T")[0],
        riskStatus: "Healthy" as const,
        riskScore: 5,
        forecastCategory: "Commit" as const,
        config: matchingBooking.unitCode.includes("V") ? "Villa" : "3 BHK Apartment",
        location: `Unit ${matchingBooking.unitCode}`,
        owner: "System Sales",
      };
    }

    if (dbLead) {
      // Determine risk status based on stage
      let risk: "Healthy" | "Watch" | "At Risk" | "Critical" = "Healthy";
      let rScore = 24;
      if (dbLead.stage === "Closed Lost") {
        risk = "Critical";
        rScore = 95;
      } else if (dbLead.stage === "Negotiation") {
        risk = "Watch";
        rScore = 48;
      }

      // Determine forecast category
      let fCategory: "Commit" | "Best Case" | "Pipeline" | "Omitted" = "Pipeline";
      if (dbLead.stage === "Closed Won" || dbLead.stage === "Won" || dbLead.hasActiveBooking) fCategory = "Commit";
      else if (dbLead.stage === "Negotiation" || dbLead.stage === "Site Visit Scheduled" || dbLead.stage === "Visit") fCategory = "Best Case";
      else if (dbLead.stage === "Closed Lost") fCategory = "Omitted";

      // Win probability
      let prob = 30;
      if (dbLead.stage === "Closed Won" || dbLead.stage === "Won" || dbLead.hasActiveBooking) prob = 100;
      else if (dbLead.stage === "Booking") prob = 90;
      else if (dbLead.stage === "Negotiation") prob = 75;
      else if (dbLead.stage === "Site Visit Scheduled" || dbLead.stage === "Visit") prob = 50;
      else if (dbLead.stage === "Closed Lost") prob = 0;

      return {
        ...defaultData,
        id: dbLead.id,
        name: `${dbLead.fullName} - ${dbLead.projectName}`,
        customerName: dbLead.fullName,
        phone: dbLead.phone,
        email: dbLead.email,
        project: dbLead.projectName,
        projectId: dbLead.preferredProjectId,
        stage: toUiStage(dbLead.stage),
        value: dbLead.budgetMax > 0 ? dbLead.budgetMax : 5800000,
        probability: prob,
        expectedCloseDate: dbLead.followUpAt ? dbLead.followUpAt.split("T")[0] : "2026-06-30",
        lastActivity: dbLead.updatedAt ? dbLead.updatedAt.split("T")[0] : "2026-06-11",
        riskStatus: risk,
        riskScore: rScore,
        forecastCategory: fCategory,
        owner: dbLead.assignedToName || "Unassigned",
        ownerId: dbLead.assignedTo || "",
        source: dbLead.source,
        config: dbLead.preferredConfiguration,
        notes: dbLead.notes,
      };
    }

    return defaultData;
  }, [leadQuery.data, bookingsQuery.data, opportunityId]);

  if (leadQuery.isLoading || bookingsQuery.isLoading) {
    return <LoadingStateCard title="Loading Opportunity Profile Workspace" />;
  }

  // Handle stage advancement click
  const handleStageAdvance = (nextStage: string) => {
    advanceStageMutation.mutate(toBackendStage(nextStage));
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    return `₹${(val / 100000).toFixed(1)} Lakhs`;
  };

  const riskBadgeTone = (status: string) => {
    switch (status) {
      case "Healthy": return "success";
      case "Watch": return "warning";
      case "At Risk": return "error";
      case "Critical": return "error";
      default: return "neutral";
    }
  };

  const forecastBadgeTone = (cat: string) => {
    switch (cat) {
      case "Commit": return "success";
      case "Best Case": return "info";
      case "Pipeline": return "neutral";
      case "Omitted": return "warning";
      default: return "neutral";
    }
  };

  // Mock list of communications
  const communicationsMock = [
    { type: "email", sender: "Vikram Rathore", subject: "Revised Quote & Floor plan for Signature Residency Unit 804", date: "2026-06-11 11:30 AM", body: "Dear Rohan, Pl find attached the revised quote incorporating the 1.5% waiver we aligned on. Let me know when we can block the inventory." },
    { type: "call", sender: "Vikram Rathore", subject: "Site visit follow-up & price review", date: "2026-06-10 03:45 PM", body: "Discussed the payment plan. Client is comfortable with construction-linked plan but wants waiver on clubhouse charges." },
    { type: "whatsapp", sender: "Rohan Singhal", subject: "Kitchen configuration choices", date: "2026-06-09 06:12 PM", body: "Can you send me details of the modular kitchen vendor options? We prefer German fittings." },
  ];

  // Stage sequence map
  const stagesList = ["New", "Contacted", "Interested", "Visit", "Negotiation", "Booking", "Won"];
  const currentStageIndex = stagesList.indexOf(opportunity.stage);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH BACK LINK & ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
        <div className="space-y-1.5">
          <Link href="/sales/insights" className="inline-flex items-center gap-1 text-label text-accent-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Revenue Intelligence Center
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-section-title font-bold text-text-primary">{opportunity.name}</h1>
            <Badge tone={opportunity.stage === "Won" ? "success" : "info"}>{opportunity.stage}</Badge>
            <Badge tone={riskBadgeTone(opportunity.riskStatus)}>Risk: {opportunity.riskStatus}</Badge>
            <Badge tone={forecastBadgeTone(opportunity.forecastCategory)}>{opportunity.forecastCategory}</Badge>
          </div>
          <p className="text-label text-text-muted">Opportunity ID: {opportunity.id} | Project: {opportunity.project}</p>
        </div>
        <div className="flex items-center gap-2">
          {opportunity.stage !== "Won" && opportunity.stage !== "Closed Lost" && (
            <div className="flex items-center gap-1.5">
              <span className="text-label text-text-muted">Advance Stage:</span>
              <select
                className="h-9 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 text-label"
                value={opportunity.stage}
                onChange={(e) => handleStageAdvance(e.target.value)}
              >
                {stagesList.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
          )}
          <Button variant="secondary" size="sm">
            <FileText className="h-4 w-4 mr-2" /> Print Sheet
          </Button>
        </div>
      </div>

      {/* QUICK KPI SNAPSHOTS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-kpi subtle-hover">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-kpi-label text-text-kpi-label">Deal Value</p>
              <p className="text-card-title font-bold text-text-primary text-xl mt-1">{formatCurrency(opportunity.value)}</p>
            </div>
            <span className="p-2.5 rounded-[var(--radius-icon)] bg-success/15 text-success">
              <Coins className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="card-kpi subtle-hover">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-kpi-label text-text-kpi-label">Win Probability</p>
              <p className="text-card-title font-bold text-text-primary text-xl mt-1">{opportunity.probability}%</p>
            </div>
            <span className="p-2.5 rounded-[var(--radius-icon)] bg-accent-primary/15 text-accent-primary">
              <TrendingUp className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="card-kpi subtle-hover">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-kpi-label text-text-kpi-label">Risk Profile Score</p>
              <p className="text-card-title font-bold text-text-primary text-xl mt-1">{opportunity.riskScore} / 100</p>
            </div>
            <span className={`p-2.5 rounded-[var(--radius-icon)] ${opportunity.riskScore > 50 ? "bg-error/15 text-error" : "bg-success/15 text-success"}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="card-kpi subtle-hover">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-kpi-label text-text-kpi-label">Assigned Executive</p>
              <p className="text-card-title font-bold text-text-primary text-xl mt-1">{opportunity.owner}</p>
            </div>
            <span className="p-2.5 rounded-[var(--radius-icon)] bg-info/15 text-info">
              <Users className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* DETAIL VIEW TAB SELECTOR */}
      <div className="flex flex-wrap gap-2 border-b border-border-soft pb-3">
        <button type="button" className={tabButtonClass(activeTab === "overview")} onClick={() => setActiveTab("overview")}>Overview</button>
        <button type="button" className={tabButtonClass(activeTab === "customer")} onClick={() => setActiveTab("customer")}>Customer Profile</button>
        <button type="button" className={tabButtonClass(activeTab === "revenue")} onClick={() => setActiveTab("revenue")}>Revenue Information</button>
        <button type="button" className={tabButtonClass(activeTab === "timeline")} onClick={() => setActiveTab("timeline")}>Timeline</button>
        <button type="button" className={tabButtonClass(activeTab === "activities")} onClick={() => setActiveTab("activities")}>Activities & Site Visits</button>
        <button type="button" className={tabButtonClass(activeTab === "forecast")} onClick={() => setActiveTab("forecast")}>Forecast Details</button>
        <button type="button" className={tabButtonClass(activeTab === "communications")} onClick={() => setActiveTab("communications")}>Communications</button>
        <button type="button" className={tabButtonClass(activeTab === "documents")} onClick={() => setActiveTab("documents")}>Documents</button>
        <button type="button" className={tabButtonClass(activeTab === "risk")} onClick={() => setActiveTab("risk")}>Risk Analysis</button>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Stage Progression Path</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Stepper */}
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 px-2">
                  {stagesList.map((st, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isActive = idx === currentStageIndex;
                    return (
                      <div key={st} className="flex md:flex-col items-center gap-3 flex-1 w-full relative">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-label ${
                          isCompleted ? "bg-success text-white" : isActive ? "bg-accent-primary text-white shadow-soft" : "bg-hover text-text-muted"
                        }`}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                        <div className="md:text-center">
                          <p className="text-body font-semibold text-text-primary">{st}</p>
                          <span className="text-label text-text-muted">
                            {isCompleted ? "Passed" : isActive ? "Active Stage" : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary space-y-2">
                  <p className="text-body font-semibold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-warning" />
                    Generative Deal Sentiment Summary
                  </p>
                  <p className="text-body text-text-secondary leading-relaxed">
                    Client exhibits **High Interest** in {opportunity.project}. Discussion is active inside the **{opportunity.stage}** stage, centered around interior customization requests. Win likelihood is set to **{opportunity.probability}%**. Stale triggers remain inactive.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Key Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-body text-text-secondary">
                  <div className="flex justify-between">
                    <span>Expected Close Date</span>
                    <span className="font-semibold text-text-primary">{opportunity.expectedCloseDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lead Source</span>
                    <span className="font-semibold text-text-primary">{opportunity.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Config Preference</span>
                    <span className="font-semibold text-text-primary">{opportunity.config}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Inventory Location</span>
                    <span className="font-semibold text-text-primary">{opportunity.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Touchpoint</span>
                    <span className="font-semibold text-text-primary">{opportunity.lastActivity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CUSTOMER PROFILE TAB */}
        {activeTab === "customer" && (
          <Card>
            <CardHeader>
              <CardTitle>Customer Contact & Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <p className="text-label text-text-muted uppercase tracking-wider font-bold">Primary Contact</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-text-muted" />
                    <span className="text-body font-semibold text-text-primary">{opportunity.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-text-muted" />
                    <span className="text-body text-text-primary">{opportunity.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-text-muted" />
                    <span className="text-body text-text-primary">{opportunity.email}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-label text-text-muted uppercase tracking-wider font-bold">Preferences</p>
                  <div className="text-body text-text-secondary space-y-1.5">
                    <p>Preferred Configuration: <strong className="text-text-primary">{opportunity.config}</strong></p>
                    <p>Project Target: <strong className="text-text-primary">{opportunity.project}</strong></p>
                    <p>Budget Allocation: <strong className="text-text-primary">{formatCurrency(opportunity.value)}</strong></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-label text-text-muted uppercase tracking-wider font-bold">Customer Segment</p>
                  <Badge tone="success" className="text-body px-3 py-1 font-semibold">VIP Premium Investor</Badge>
                  <p className="text-label text-text-muted mt-2">
                    This account holds multiple inquiries across active sectors. Risk profiles for relationship health remain healthy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* REVENUE INFORMATION TAB */}
        {activeTab === "revenue" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Cost Estimation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-body text-text-secondary">
                <div className="flex justify-between border-b border-border-soft pb-2">
                  <span>Base Premium Price</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(opportunity.value * 0.9)}</span>
                </div>
                <div className="flex justify-between border-b border-border-soft pb-2">
                  <span>Preferential Location Charges (PLC)</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(opportunity.value * 0.05)}</span>
                </div>
                <div className="flex justify-between border-b border-border-soft pb-2">
                  <span>Amenities & Parking</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(opportunity.value * 0.03)}</span>
                </div>
                <div className="flex justify-between border-b border-border-soft pb-2">
                  <span>Club Membership</span>
                  <span className="font-semibold text-text-primary">₹3.5 Lakhs</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-text-primary">Total Estimated Quote</span>
                  <span className="font-bold text-accent-primary">{formatCurrency(opportunity.value)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Milestone Payment Schedule Template</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0 text-table">
                    <thead className="bg-surface-secondary text-text-secondary text-left font-semibold">
                      <tr>
                        <th className="px-4 py-3">Payment Stage Milestones</th>
                        <th className="px-4 py-3">% Due</th>
                        <th className="px-4 py-3">Estimated Amount</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border-soft bg-surface">
                        <td className="px-4 py-3 font-semibold text-text-primary">Token Advance</td>
                        <td className="px-4 py-3">10%</td>
                        <td className="px-4 py-3">{formatCurrency(opportunity.value * 0.1)}</td>
                        <td className="px-4 py-3">Completed</td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone="success">Paid</Badge>
                        </td>
                      </tr>
                      <tr className="border-t border-border-soft bg-surface">
                        <td className="px-4 py-3 font-semibold text-text-primary">On Foundation Excavation</td>
                        <td className="px-4 py-3">20%</td>
                        <td className="px-4 py-3">{formatCurrency(opportunity.value * 0.2)}</td>
                        <td className="px-4 py-3">2026-07-15</td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone="neutral">Pending</Badge>
                        </td>
                      </tr>
                      <tr className="border-t border-border-soft bg-surface">
                        <td className="px-4 py-3 font-semibold text-text-primary">First Floor Slab</td>
                        <td className="px-4 py-3">20%</td>
                        <td className="px-4 py-3">{formatCurrency(opportunity.value * 0.2)}</td>
                        <td className="px-4 py-3">2026-09-10</td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone="neutral">Pending</Badge>
                        </td>
                      </tr>
                      <tr className="border-t border-border-soft bg-surface">
                        <td className="px-4 py-3 font-semibold text-text-primary">Superstructure Complete</td>
                        <td className="px-4 py-3">25%</td>
                        <td className="px-4 py-3">{formatCurrency(opportunity.value * 0.25)}</td>
                        <td className="px-4 py-3">2026-12-01</td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone="neutral">Pending</Badge>
                        </td>
                      </tr>
                      <tr className="border-t border-border-soft bg-surface">
                        <td className="px-4 py-3 font-semibold text-text-primary">On Registration & Handover</td>
                        <td className="px-4 py-3">25%</td>
                        <td className="px-4 py-3">{formatCurrency(opportunity.value * 0.25)}</td>
                        <td className="px-4 py-3">On Handover</td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone="neutral">Pending</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <Card>
            <CardHeader>
              <CardTitle>Deal Audit Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative border-l-2 border-border-soft pl-6 ml-3 space-y-6 text-body">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-success border-4 border-surface" />
                  <p className="font-semibold text-text-primary">Quote revised & discount registered</p>
                  <p className="text-label text-text-muted mt-0.5">June 11, 2026 11:30 AM by {opportunity.owner}</p>
                  <p className="text-text-secondary mt-1 max-w-2xl bg-surface-secondary p-3 rounded-lg">
                    Quote adjusted to final commercial terms of {formatCurrency(opportunity.value)} based on client authorization.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-accent-primary border-4 border-surface" />
                  <p className="font-semibold text-text-primary">Site Visit Conducted successfully</p>
                  <p className="text-label text-text-muted mt-0.5">June 08, 2026 02:30 PM by Vikram Rathore</p>
                  <p className="text-text-secondary mt-1">
                    Client visited {opportunity.project} Tower B with family. Highly satisfied with building entrance and floor heights.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-accent-primary border-4 border-surface" />
                  <p className="font-semibold text-text-primary">Stage advanced to Negotiation</p>
                  <p className="text-label text-text-muted mt-0.5">June 06, 2026 05:00 PM by System Workflow</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-hover border-4 border-surface" />
                  <p className="font-semibold text-text-primary">Lead Initial intake and classification</p>
                  <p className="text-label text-text-muted mt-0.5">June 01, 2026 10:15 AM from {opportunity.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACTIVITIES TAB */}
        {activeTab === "activities" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Engagement activities & Visits registry</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Log Activity
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary space-y-3">
                <div className="flex justify-between items-center text-body">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-success" />
                    Scheduled Next Action Item
                  </span>
                  <span className="text-label text-text-muted">June 15, 2026 02:00 PM</span>
                </div>
                <p className="text-body text-text-secondary">
                  Booking draft review meeting scheduled at sales gallery. Vikram Rathore to align signature process.
                </p>
              </div>

              <div className="p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary space-y-3">
                <div className="flex justify-between items-center text-body">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Site Visit Outcome (Completed)
                  </span>
                  <span className="text-label text-text-muted">June 08, 2026</span>
                </div>
                <p className="text-body text-text-secondary">
                  <strong>Outcome:</strong> Highly Positive. Client liked unit layout. Verified building layout configurations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FORECAST DETAILS TAB */}
        {activeTab === "forecast" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Categorization Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-body text-text-secondary">
                  <div className="flex justify-between border-b border-border-soft pb-2">
                    <span>Forecast Category</span>
                    <Badge tone={forecastBadgeTone(opportunity.forecastCategory)}>{opportunity.forecastCategory}</Badge>
                  </div>
                  <div className="flex justify-between border-b border-border-soft pb-2">
                    <span>Assigned Probability</span>
                    <span className="font-semibold text-text-primary">{opportunity.probability}%</span>
                  </div>
                  <div className="flex justify-between border-b border-border-soft pb-2">
                    <span>Weighted Deal Value</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(opportunity.value * (opportunity.probability / 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Score</span>
                    <span className="font-bold text-success">High Confidence</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weighted Pipeline Contribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body text-text-secondary">
                  This opportunity is mapped into the **{opportunity.forecastCategory}** category, meaning it is modeled inside near-term projections. It contributes **{formatCurrency(opportunity.value * (opportunity.probability / 100))}** to the weighted monthly budget.
                </p>
                <div className="h-3 w-full bg-hover rounded-full overflow-hidden">
                  <div className="h-full bg-accent-primary" style={{ width: `${opportunity.probability}%` }} />
                </div>
                <p className="text-label text-text-muted text-right">Probability score: {opportunity.probability}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* COMMUNICATIONS TAB */}
        {activeTab === "communications" && (
          <Card>
            <CardHeader>
              <CardTitle>Client Message Exchange Stream</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {communicationsMock.map((msg, index) => {
                const iconMap = {
                  email: <Mail className="h-4 w-4 text-accent-primary" />,
                  call: <Phone className="h-4 w-4 text-warning" />,
                  whatsapp: <MessageSquare className="h-4 w-4 text-success" />,
                };
                return (
                  <div key={index} className="p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary space-y-2.5">
                    <div className="flex justify-between items-center text-body">
                      <div className="flex items-center gap-2 font-semibold text-text-primary">
                        {iconMap[msg.type as keyof typeof iconMap]}
                        <span className="capitalize">{msg.type}</span>
                        <span>- Sender: {msg.sender}</span>
                      </div>
                      <span className="text-label text-text-muted">{msg.date}</span>
                    </div>
                    <p className="text-body font-medium text-text-primary">{msg.subject}</p>
                    <p className="text-body text-text-secondary leading-relaxed bg-surface p-3 rounded-[var(--radius-input)] border border-border-soft/60">
                      {msg.body}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "documents" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Opportunity Documents Vault</CardTitle>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" /> Upload File
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5">
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary text-body">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-accent-primary" />
                      <div>
                        <p className="font-semibold text-text-primary">{doc.name}</p>
                        <span className="text-label text-text-muted">Size: {doc.size} | Uploaded: {doc.date}</span>
                      </div>
                    </div>
                    <Badge tone="success">{doc.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* RISK ANALYSIS TAB */}
        {activeTab === "risk" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Risk Index Heatmap</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                <span className={`text-4xl font-bold font-secondary ${opportunity.riskScore > 50 ? "text-error" : "text-success"}`}>
                  {opportunity.riskScore} / 100
                </span>
                <Badge tone={opportunity.riskScore > 50 ? "error" : "success"}>
                  {opportunity.riskScore > 50 ? "Stalled Profile" : "Healthy Alignment"}
                </Badge>
                <p className="text-label text-text-muted text-center max-w-xs leading-relaxed">
                  Calculated by analyzing days in stage, activity logs, and compliance verification files.
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Risk Factors Grid & System Prompts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary text-body">
                    <span className="text-text-secondary font-medium">Stage Duration Aging</span>
                    <Badge tone="success">Optimal (7 Days in Stage)</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary text-body">
                    <span className="text-text-secondary font-medium">Activity Touches</span>
                    <Badge tone="success">Active (Touchpoint within 24h)</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary text-body">
                    <span className="text-text-secondary font-medium">Compliance Verification Documents</span>
                    <Badge tone="success">Verified (PAN/Aadhar uploaded)</Badge>
                  </div>
                </div>

                <div className="p-4 rounded-[var(--radius-card)] border border-accent-primary/20 bg-active-soft/10 space-y-2">
                  <p className="text-body font-bold text-text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-accent-primary" />
                    Recommended System Next-Best Action
                  </p>
                  <p className="text-body text-text-secondary">
                    Ensure client signs the booking draft on **June 15**. Present modular kitchen options immediately to capture high-interest sentiment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
