"use client";
import { toast } from "@/components/ui/toast";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Coins,
  User,
  Compass,
  CalendarDays,
  Clock,
  MessageSquare,
  Award,
  Calendar,
  CheckCircle,
  FileCheck,
  Send,
  AlertCircle,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { formatDate, formatDateTime, toneForStage } from "@/lib/erp-utils";

interface FollowUpDetailProps {
  leadId: string;
}

export function FollowUpDetail({ leadId }: FollowUpDetailProps) {
  const role = useUiStore((state) => state.role);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "history" | "deals">("overview");
  const [quickNote, setQuickNote] = useState("");

  // Queries
  const leadDetailQuery = useQuery({
    queryKey: ["erp-lead-detail", leadId, role],
    queryFn: async () => (await apiRequest<any>(`/api/leads/${leadId}`, { role })).data,
  });

  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<any>("/api/bookings", { role })).data,
  });

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      // Simulate adding a communication note by patching lead
      const currentNotes = leadDetailQuery.data?.profile?.notes || "";
      const updatedNotes = `${note}\n---\n${currentNotes}`;
      return apiRequest(`/api/leads/${leadId}`, {
        role,
        method: "PATCH",
        body: { notes: updatedNotes },
      });
    },
    onSuccess: async () => {
      setQuickNote("");
      await queryClient.invalidateQueries({ queryKey: ["erp-lead-detail", leadId] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (dateTime: string) => {
      return apiRequest(`/api/leads/${leadId}`, {
        role,
        method: "PATCH",
        body: { followUpAt: dateTime },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-lead-detail", leadId] });
      toast.success("Follow-up rescheduled successfully!");
    },
  });

  const profileData = leadDetailQuery.data?.profile;
  const communicationsData = leadDetailQuery.data?.communications || [];
  const siteVisitsData = leadDetailQuery.data?.siteVisits || [];
  const followUpsData = leadDetailQuery.data?.followUps || [];
  const bookingsData = bookingsQuery.data?.bookings || [];
  const linkedBookingData = profileData
    ? bookingsData.find((b: any) => b.leadId === leadId || b.customerPhone === profileData.phone)
    : undefined;

  // Compile detailed timeline events: Call, Message, Visits, Booking
  const timelineEvents = useMemo(() => {
    if (!profileData) return [];
    const events: Array<{
      id: string;
      title: string;
      description: string;
      date: string;
      type: "call" | "message" | "followup" | "visit" | "booking" | "stage";
      actor: string;
    }> = [];

    // Stages / Creation
    events.push({
      id: "evt-create",
      title: "Lead Captured",
      description: `Lead created from ${profileData.source} with preferred interest in ${profileData.projectName}.`,
      date: profileData.createdAt,
      type: "stage",
      actor: "System",
    });

    // Communications
    (communicationsData || []).forEach((c: any) => {
      events.push({
        id: c.id,
        title: c.type === "Call" ? "Call Logged" : "Message Sent",
        description: `${c.subject}: ${c.summary}`,
        date: c.createdAt,
        type: c.type === "Call" ? "call" : "message",
        actor: c.actorName,
      });
    });

    // Visits
    (siteVisitsData || []).forEach((v: any) => {
      events.push({
        id: v.id,
        title: `Site Visit ${v.status}`,
        description: `Project: ${v.projectName}. Outcome: ${v.outcome || "Pending tour completion."}`,
        date: v.scheduledAt,
        type: "visit",
        actor: v.coordinatorName,
      });
    });

    // FollowUps
    (followUpsData || []).forEach((f: any) => {
      events.push({
        id: f.id,
        title: `Follow-Up Scheduled`,
        description: `Notes: ${f.notes}`,
        date: f.scheduledAt,
        type: "followup",
        actor: f.actorName,
      });
    });

    // Booking
    if (linkedBookingData) {
      events.push({
        id: linkedBookingData.id,
        title: "Booking Created",
        description: `Unit: ${linkedBookingData.unitCode} in ${linkedBookingData.projectName}. Value: ₹${(linkedBookingData.totalAmount / 10000000).toFixed(2)} Cr. Status: ${linkedBookingData.status}`,
        date: linkedBookingData.bookingDate || profileData.updatedAt,
        type: "booking",
        actor: linkedBookingData.customerName,
      });
    }

    // Sort chronologically descending
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [profileData, communicationsData, siteVisitsData, followUpsData, linkedBookingData]);

  if (leadDetailQuery.isLoading || bookingsQuery.isLoading) {
    return <LoadingStateCard title="Loading Action Center Profile..." />;
  }

  if (leadDetailQuery.isError || !leadDetailQuery.data) {
    return <ErrorStateCard message="Lead profile details could not be loaded." />;
  }

  const { profile, activities, siteVisits, communications, followUps } = leadDetailQuery.data;

  // Find linked bookings
  const bookings = bookingsQuery.data?.bookings || [];
  const linkedBooking = bookings.find((b: any) => b.leadId === leadId || b.customerPhone === profile.phone);

  // Conversion Probability score calculation
  const stagesList = ["New", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Booking", "Closed Won"];
  const stageIndex = stagesList.indexOf(profile.stage);
  const conversionProbability =
    profile.stage === "Closed Lost"
      ? 0
      : profile.stage === "Closed Won"
      ? 100
      : Math.round(((stageIndex + 1) / stagesList.length) * 100);

  const isOverdue =
    !["Closed Won", "Closed Lost"].includes(profile.stage) &&
    new Date(profile.followUpAt).getTime() < Date.now();

  const handleRescheduleClick = () => {
    const nextDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const newDateTime = prompt("Enter new follow-up date/time (YYYY-MM-DDTHH:MM):", nextDate);
    if (newDateTime) {
      rescheduleMutation.mutate(newDateTime);
    }
  };

  const handleDial = () => {
    toast.info(`Initiating VoIP call connection to ${profile.phone}...`);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hello ${profile.fullName}, following up from Nimble ERP.`);
    window.open(`https://wa.me/${profile.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <section className="space-y-6 pb-12 animate-page-in">
      {/* Back button header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/sales/follow-ups")}
          className="border-border-strong text-text-secondary gap-1.5 h-10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Action Center</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleWhatsApp} className="border-border-strong text-green-600 gap-1.5 h-10">
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDial} className="border-border-strong text-blue-600 gap-1.5 h-10">
            <Phone className="h-4 w-4" />
            <span>Dial Lead</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleRescheduleClick} className="text-white gap-1.5 h-10 font-semibold">
            <Calendar className="h-4 w-4" />
            <span>Reschedule</span>
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="border-border-soft bg-surface p-6 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4.5">
            <div className="rounded-full bg-accent-primary/10 text-accent-primary p-4 h-16 w-16 flex items-center justify-center text-page-title font-bold shrink-0">
              {profile.firstName.charAt(0)}
              {profile.lastName.charAt(0) || "L"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-page-title font-secondary font-bold text-text-primary">
                  {profile.fullName}
                </h1>
                <Badge tone={toneForStage(profile.stage)} className="text-[10px] font-bold py-0.5 uppercase tracking-wider">
                  {profile.stage}
                </Badge>
                {isOverdue && (
                  <Badge tone="error" className="text-[10px] font-bold py-0.5 uppercase tracking-wider">
                    Overdue Follow-Up
                  </Badge>
                )}
              </div>
              <p className="text-body text-text-muted mt-1 flex items-center gap-1.5 flex-wrap">
                <Building className="h-4 w-4 shrink-0 text-text-muted" />
                <span>Project: {profile.projectName}</span>
                <span className="text-border-soft">•</span>
                <Coins className="h-4 w-4 shrink-0 text-text-muted" />
                <span>Budget: {profile.budgetLabel}</span>
                <span className="text-border-soft">•</span>
                <User className="h-4 w-4 shrink-0 text-text-muted" />
                <span>Owner: {profile.assignedToName}</span>
              </p>
            </div>
          </div>

          {/* Core Conversion probability progress */}
          <div className="bg-surface-secondary border border-border-soft p-4 rounded-[var(--radius-card)] min-w-[240px] shrink-0 space-y-2">
            <div className="flex items-center justify-between text-label">
              <span className="text-text-muted font-bold">CONVERSION SCORE</span>
              <span className="font-extrabold text-accent-primary">{conversionProbability}% Probability</span>
            </div>
            <div className="h-2 w-full rounded-full bg-hover relative overflow-hidden">
              <div
                className="h-2 rounded-full bg-accent-primary transition-all duration-300"
                style={{ width: `${conversionProbability}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main detail page columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Overview, Profile, Requirements */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Details */}
          <Card className="border-border-soft">
            <CardHeader className="pb-3 border-b border-border-soft">
              <CardTitle className="text-card-title text-text-primary font-semibold">
                Lead Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-body text-text-secondary">
              <div className="flex items-center gap-3">
                <div className="bg-surface-secondary text-text-secondary p-2 rounded-full">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Phone</p>
                  <p className="font-bold text-text-primary">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-surface-secondary text-text-secondary p-2 rounded-full">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-text-primary truncate">{profile.email || "inquiry@easesmith.com"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-surface-secondary text-text-secondary p-2 rounded-full">
                  <Compass className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Acquisition Source</p>
                  <p className="font-semibold text-text-primary">{profile.source}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-surface-secondary text-text-secondary p-2 rounded-full">
                  <CalendarDays className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Follow-Up Target</p>
                  <p className={`font-bold ${isOverdue ? "text-error" : "text-text-primary"}`}>
                    {formatDateTime(profile.followUpAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirement profile details */}
          <Card className="border-border-soft">
            <CardHeader className="pb-3 border-b border-border-soft">
              <CardTitle className="text-card-title text-text-primary font-semibold">
                Commercial Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-body text-text-secondary">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-label text-text-muted">Min Budget Limit</p>
                  <p className="font-bold text-text-primary">₹{(profile.budgetMin / 100000).toFixed(0)} Lakhs</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-label text-text-muted">Max Budget Limit</p>
                  <p className="font-bold text-text-primary">₹{(profile.budgetMax / 100000).toFixed(0)} Lakhs</p>
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <p className="text-label text-text-muted">Preferred Configuration</p>
                <p className="font-bold text-text-primary">{profile.preferredConfiguration}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border-soft">
                <p className="text-label text-text-muted font-semibold">Active Executive Notes</p>
                <div className="bg-surface-secondary p-3.5 rounded-[var(--radius-input)] border border-border-soft italic leading-relaxed text-text-secondary font-medium">
                  "{profile.notes || "No extra configuration notes recorded."}"
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick task list */}
          <Card className="border-border-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-accent-primary" />
                <span>Next Action Checklists</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-label text-text-secondary">
              <div className="flex items-center gap-2.5 p-1 bg-surface-secondary rounded border border-border-soft">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border-strong text-accent-primary" />
                <span className="line-through text-text-muted">Perform budget discovery review</span>
              </div>
              <div className="flex items-center gap-2.5 p-1 bg-surface-secondary rounded border border-border-soft">
                <input type="checkbox" defaultChecked={stageIndex >= 3} className="h-4 w-4 rounded border-border-strong text-accent-primary" />
                <span>Verify KYC credentials files</span>
              </div>
              <div className="flex items-center gap-2.5 p-1 bg-surface-secondary rounded border border-border-soft">
                <input type="checkbox" defaultChecked={stageIndex >= 4} className="h-4 w-4 rounded border-border-strong text-accent-primary" />
                <span>Email draft project price list sheets</span>
              </div>
              <div className="flex items-center gap-2.5 p-1 bg-surface-secondary rounded border border-border-soft">
                <input type="checkbox" defaultChecked={stageIndex >= 5} className="h-4 w-4 rounded border-border-strong text-accent-primary" />
                <span>Confirm site visit scheduler availability</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Timeline, history, deal metrics */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tab Navigation header */}
          <div className="flex items-center border-b border-border-soft gap-4 flex-wrap">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 font-semibold text-body transition-colors border-b-2 px-1 ${
                activeTab === "overview" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Timeline Overview
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3 font-semibold text-body transition-colors border-b-2 px-1 ${
                activeTab === "timeline" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Logs ({timelineEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 font-semibold text-body transition-colors border-b-2 px-1 ${
                activeTab === "history" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Audits ({activities.length})
            </button>
            {linkedBooking && (
              <button
                onClick={() => setActiveTab("deals")}
                className={`pb-3 font-semibold text-body transition-colors border-b-2 px-1 ${
                  activeTab === "deals" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                Deal Closure Profile
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Timeline display */}
                <Card className="border-border-soft">
                  <CardHeader>
                    <CardTitle className="text-card-title text-text-primary font-semibold">
                      Proactive Communication Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="relative border-l-2 border-border-strong ml-4 pl-6 space-y-6">
                      {timelineEvents.slice(0, 4).map((evt) => {
                        let dotBg = "bg-blue-500";
                        if (evt.type === "visit") dotBg = "bg-amber-500";
                        if (evt.type === "booking") dotBg = "bg-green-500";
                        if (evt.type === "message") dotBg = "bg-emerald-400";
                        if (evt.type === "stage") dotBg = "bg-indigo-500";

                        return (
                          <div key={evt.id} className="relative">
                            <span className={`absolute -left-9.5 top-1 h-6 w-6 rounded-full border-4 border-surface ${dotBg} flex items-center justify-center shadow-soft`} />
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <span className="font-bold text-text-primary text-body">
                                  {evt.title}
                                </span>
                                <span className="text-label text-text-muted">
                                  {formatDateTime(evt.date)}
                                </span>
                              </div>
                              <p className="text-body text-text-secondary leading-relaxed">{evt.description}</p>
                              <p className="text-[10px] text-text-muted">Logged by: {evt.actor}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick notes logging */}
                <Card className="border-border-soft">
                  <CardHeader>
                    <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                      <Send className="h-4.5 w-4.5 text-accent-primary" />
                      <span>Log Communication Note</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-3">
                    <textarea
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      placeholder="Type a summary of the latest call, SMS request, or client objection detail here..."
                      className="w-full min-h-[96px] rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] focus-visible:border-accent-primary"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        loading={addNoteMutation.isPending}
                        disabled={!quickNote.trim()}
                        className="text-white font-semibold h-10 px-6 gap-1"
                        onClick={() => addNoteMutation.mutate(quickNote)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Log Touchpoint</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "timeline" && (
              <Card className="border-border-soft">
                <CardHeader>
                  <CardTitle className="text-card-title text-text-primary font-semibold">
                    Complete Logs & Touchpoints History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 max-h-[500px] overflow-y-auto">
                  <div className="relative border-l-2 border-border-strong ml-4 pl-6 space-y-6">
                    {timelineEvents.map((evt) => {
                      let dotBg = "bg-blue-500";
                      if (evt.type === "visit") dotBg = "bg-amber-500";
                      if (evt.type === "booking") dotBg = "bg-green-500";
                      if (evt.type === "message") dotBg = "bg-emerald-400";
                      if (evt.type === "stage") dotBg = "bg-indigo-500";

                      return (
                        <div key={evt.id} className="relative">
                          <span className={`absolute -left-9.5 top-1 h-6 w-6 rounded-full border-4 border-surface ${dotBg} flex items-center justify-center shadow-soft`} />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <span className="font-bold text-text-primary text-body">
                                {evt.title}
                              </span>
                              <span className="text-label text-text-muted">
                                {formatDateTime(evt.date)}
                              </span>
                            </div>
                            <p className="text-body text-text-secondary leading-relaxed">{evt.description}</p>
                            <p className="text-[10px] text-text-muted">Actor: {evt.actor}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "history" && (
              <Card className="border-border-soft">
                <CardHeader>
                  <CardTitle className="text-card-title text-text-primary font-semibold">
                    System Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 max-h-[500px] overflow-y-auto space-y-4">
                  {(activities || []).map((act: any) => (
                    <div key={act.id} className="surface-secondary p-3.5 rounded-lg border border-border-soft space-y-1.5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <span className="font-bold text-text-primary text-body">{act.title}</span>
                        <span className="text-label text-text-muted">{formatDate(act.createdAt)}</span>
                      </div>
                      <p className="text-label text-text-secondary leading-relaxed">{act.detail}</p>
                      <p className="text-[10px] text-text-muted">Audited by: {act.actorName}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "deals" && linkedBooking && (
              <Card className="border-border-soft hover:shadow-soft transition-all duration-200">
                <CardHeader className="pb-3 border-b border-border-soft">
                  <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                    <FileCheck className="h-5 w-5 text-emerald-500" />
                    <span>Linked Booking Closure Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-body text-text-secondary">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface-secondary p-4 rounded-lg border border-border-soft space-y-1.5">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Booking Ref</p>
                      <p className="font-bold text-text-primary text-body">BK-{linkedBooking.id.slice(0, 6).toUpperCase()}</p>
                    </div>
                    <div className="bg-surface-secondary p-4 rounded-lg border border-border-soft space-y-1.5">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Booking Status</p>
                      <Badge tone="success" className="font-bold uppercase py-0.5 tracking-wider text-[9px]">{linkedBooking.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-dashed border-border-soft pt-4">
                    <div className="flex justify-between items-center text-label">
                      <span className="text-text-muted font-semibold">Allocated Unit Code</span>
                      <span className="font-bold text-text-primary">{linkedBooking.unitCode} ({linkedBooking.projectName})</span>
                    </div>
                    <div className="flex justify-between items-center text-label">
                      <span className="text-text-muted font-semibold">Agreement Signing Status</span>
                      <span className="font-bold text-text-primary">{linkedBooking.agreementStatus || "Pending"}</span>
                    </div>
                    <div className="flex justify-between items-center text-label">
                      <span className="text-text-muted font-semibold">Payment Plan Structure</span>
                      <span className="font-bold text-text-primary">{linkedBooking.paymentPlanType}</span>
                    </div>
                  </div>

                  <div className="border-t border-border-soft pt-4 space-y-2.5 text-label">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted font-bold">Total Agreed Value:</span>
                      <span className="font-extrabold text-text-primary text-body">₹{(linkedBooking.totalAmount / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted font-bold">Total Paid down payment:</span>
                      <span className="font-bold text-emerald-600 text-body">₹{(linkedBooking.totalPaid / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted font-bold">Total Outstanding Amount:</span>
                      <span className="font-bold text-amber-600 text-body">₹{(linkedBooking.outstandingAmount / 10000000).toFixed(2)} Cr</span>
                    </div>
                  </div>

                  {/* Payment Milestone progress */}
                  <div className="space-y-1.5 pt-3">
                    <div className="flex justify-between text-label text-text-muted font-bold">
                      <span>Milestone Installment Progress</span>
                      <span>{Math.round((linkedBooking.totalPaid / (linkedBooking.totalAmount || 1)) * 100)}% Paid</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-hover relative overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${Math.round((linkedBooking.totalPaid / (linkedBooking.totalAmount || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
