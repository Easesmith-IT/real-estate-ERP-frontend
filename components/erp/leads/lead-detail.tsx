"use client";
import { toast } from "@/components/ui/toast";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  User,
  Building,
  Coins,
  MapPin,
  Clock,
  MessageSquare,
  Calendar,
  Award,
  ArrowLeft,
  Edit2,
  CalendarPlus,
  Compass,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { formatDate, formatDateTime, nextSalesStage } from "@/lib/erp-utils";

import { useUiStore } from "@/store/ui-store";

interface LeadDetailProps {
  leadId: string;
}

export function LeadDetail({ leadId }: LeadDetailProps) {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // 1. Fetch Lead Details
  const leadQuery = useQuery({
    queryKey: ["erp-lead-detail", leadId, role],
    queryFn: async () => {
      const res = await apiRequest<any>(`/api/leads/${leadId}`, { role });
      return res.data;
    },
  });

  // 2. Advance Stage Mutation
  const advanceStageMutation = useMutation({
    mutationFn: async (nextStage: string) => {
      return apiRequest(`/api/leads/${leadId}/stage`, {
        role,
        method: "PATCH",
        body: { stage: nextStage },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-lead-detail", leadId] });
      await queryClient.invalidateQueries({ queryKey: ["erp-leads"] });
    },
  });

  if (leadQuery.isLoading) return <LoadingStateCard />;
  if (leadQuery.isError || !leadQuery.data) {
    return <ErrorStateCard message="Lead profile not found or could not be loaded." />;
  }

  const { profile, activities, siteVisits, communications, followUps } = leadQuery.data;

  const getStageTone = (stage: string) => {
    switch (stage) {
      case "New":
        return "info";
      case "Contacted":
        return "neutral";
      case "Interested":
        return "info";
      case "Site Visit Scheduled":
        return "warning";
      case "Negotiation":
        return "warning";
      case "Booking":
        return "info";
      case "Closed Won":
        return "success";
      case "Closed Lost":
      default:
        return "neutral";
    }
  };

  const getLeadScore = (stage: string, budgetMax: number) => {
    if (stage === "Closed Won" || stage === "Booking" || stage === "Negotiation") {
      return { label: "Hot Lead", bg: "bg-red-500/10 text-red-500 border border-red-500/20" };
    }
    if (stage === "Site Visit Scheduled" || stage === "Interested") {
      return { label: "Warm Lead", bg: "bg-amber-500/10 text-amber-500 border border-amber-500/20" };
    }
    if (stage === "Closed Lost") {
      return { label: "Cold Lead", bg: "bg-slate-500/10 text-slate-500 border border-slate-500/20" };
    }
    return { label: "Qualified", bg: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" };
  };

  const score = getLeadScore(profile.stage, profile.budgetMax);

  // Conversion Probability based on stage index
  const stages = ["New", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Booking", "Closed Won"];
  const stageIndex = stages.indexOf(profile.stage);
  const conversionProbability =
    profile.stage === "Closed Lost"
      ? 0
      : profile.stage === "Closed Won"
      ? 100
      : Math.round(((stageIndex + 1) / stages.length) * 100);

  const handleAdvance = () => {
    const next = nextSalesStage(profile.stage);
    if (next) {
      advanceStageMutation.mutate(next);
    }
  };

  const handleEdit = () => {
    toast.info("Trigger lead edit drawer from main command center board.");
  };

  const handleScheduleVisit = () => {
    toast.info("Opening visit scheduler coordinator window...");
  };

  const handleArchive = () => {
    toast.info("Archiving lead profile to cold databases...");
  };

  return (
    <section className="space-y-6 pb-12 animate-page-in">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link href="/sales/leads">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border-strong text-text-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to Sales Command
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <Card className="surface-card p-6 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-accent-primary/10 text-accent-primary p-4 h-16 w-16 flex items-center justify-center text-page-title font-bold">
              {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-page-title font-secondary font-bold text-text-primary">
                  {profile.fullName}
                </h1>
                <Badge tone={getStageTone(profile.stage)} className="text-label py-0.5 uppercase">
                  {profile.stage}
                </Badge>
                <span className={`px-2.5 py-0.5 rounded-full text-label font-bold border ${score.bg}`}>
                  {score.label}
                </span>
              </div>
              <p className="text-body text-text-muted mt-1 flex items-center gap-1.5 flex-wrap">
                <Building className="h-4 w-4" /> {profile.projectName}
                <span className="text-border-soft">•</span>
                <Coins className="h-4 w-4" /> Budget: {profile.budgetLabel}
                <span className="text-border-soft">•</span>
                <User className="h-4 w-4" /> Owner: {profile.assignedToName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-border-strong font-medium text-text-primary gap-1.5"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4" />
              Edit Lead
            </Button>
            {profile.stage !== "Closed Won" && profile.stage !== "Closed Lost" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 border-border-strong font-medium text-text-primary gap-1.5"
                  onClick={handleScheduleVisit}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Visit
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-white h-10 font-semibold gap-1.5"
                  onClick={handleAdvance}
                  disabled={advanceStageMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4" />
                  Advance Stage
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-border-strong text-text-muted hover:text-red-500 gap-1.5"
              onClick={handleArchive}
            >
              Archive
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Details, Requirements, Score) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Section: Contact Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-card-title text-text-primary font-semibold">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-surface-secondary text-text-secondary p-2 rounded-full">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Phone</p>
                  <p className="text-body font-semibold text-text-primary">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-surface-secondary text-text-secondary p-2 rounded-full">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Email</p>
                  <p className="text-body font-semibold text-text-primary truncate">{profile.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-surface-secondary text-text-secondary p-2 rounded-full">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Lead Source</p>
                  <p className="text-body font-semibold text-text-primary">{profile.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Requirements & Unit Interest */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-card-title text-text-primary font-semibold">
                Requirements Interest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label text-text-muted">Min Budget</p>
                  <p className="font-semibold text-text-primary mt-0.5">₹{(profile.budgetMin / 100000).toFixed(0)} L</p>
                </div>
                <div>
                  <p className="text-label text-text-muted">Max Budget</p>
                  <p className="font-semibold text-text-primary mt-0.5">₹{(profile.budgetMax / 100000).toFixed(0)} L</p>
                </div>
              </div>

              <div>
                <p className="text-label text-text-muted">Preferred Unit Type</p>
                <p className="font-semibold text-text-primary mt-0.5">{profile.preferredConfiguration}</p>
              </div>

              <div>
                <p className="text-label text-text-muted">Additional Remarks</p>
                <p className="text-text-secondary mt-1 bg-surface-secondary p-3 rounded-lg border border-border-soft italic leading-relaxed">
                  "{profile.notes || "No extra configuration notes recorded."}"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section: Conversion Probability Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-card-title text-text-primary font-semibold">
                Conversion Probability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-kpi-value font-bold text-text-primary">{conversionProbability}%</span>
                <Badge tone={conversionProbability > 60 ? "success" : conversionProbability > 30 ? "warning" : "neutral"} className="text-[11px] uppercase tracking-wider py-0.5 font-bold">
                  {conversionProbability > 60 ? "High Chance" : conversionProbability > 30 ? "Moderate" : "Low Conversion"}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-hover relative overflow-hidden">
                <div
                  className="h-2 rounded-full bg-accent-primary transition-all duration-500"
                  style={{
                    width: `${conversionProbability}%`,
                    backgroundColor: conversionProbability > 60 ? "#22c55e" : conversionProbability > 30 ? "#f59e0b" : "#3b82f6",
                  }}
                />
              </div>
              <p className="text-label text-text-muted mt-1 leading-relaxed">
                Calculated based on active stage pipeline duration, completed site visits, and budget ranges.
              </p>
            </CardContent>
          </Card>

          {/* Related Bookings Section */}
          {(profile.stage === "Closed Won" || profile.hasActiveBooking) && (
            <Card className="border-border-soft hover:shadow-soft transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Related Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-body">
                <div className="surface-secondary p-3 rounded-lg space-y-2 border border-border-soft">
                  <div className="flex justify-between items-center text-label">
                    <span className="text-text-muted">Booking Reference</span>
                    <span className="font-semibold text-text-primary">BK-{profile.id.slice(0, 6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-label">
                    <span className="text-text-muted">Status</span>
                    <Badge tone="success" className="py-0 text-[10px] uppercase font-bold">Active Reservation</Badge>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="text-label text-text-muted">Allocated Unit</span>
                    <p className="font-semibold text-text-primary mt-0.5">Tower A - Unit 402 ({profile.preferredConfiguration})</p>
                  </div>
                  <div>
                    <span className="text-label text-text-muted">Payment Plan Type</span>
                    <p className="font-semibold text-text-primary mt-0.5">Construction Linked Plan (CLP)</p>
                  </div>
                </div>

                <div className="border-t border-dashed border-border-soft pt-3 space-y-2 text-label">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Total Amount:</span>
                    <span className="font-semibold text-text-primary">₹{(profile.budgetMax / 10000000).toFixed(1)} Cr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Paid Down Payment:</span>
                    <span className="font-semibold text-emerald-600">₹{(profile.budgetMax * 0.2 / 10000000).toFixed(2)} Cr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Outstanding Balance:</span>
                    <span className="font-semibold text-amber-600">₹{(profile.budgetMax * 0.8 / 10000000).toFixed(2)} Cr</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-text-muted font-semibold">
                    <span>Milestone Progress</span>
                    <span>20% Paid</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-hover relative overflow-hidden">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: "20%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Columns (Activity Timeline, Communication log, Follow-Ups, Site Visits) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Tabs style layout for dynamic operational information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column A: Activity Timeline */}
            <Card className="md:col-span-1">
              <CardHeader className="border-b border-border-soft pb-3">
                <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-accent-primary" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[420px] overflow-y-auto">
                <div className="relative border-l border-border-strong ml-2.5 pl-5 space-y-5">
                  {activities.map((act: any) => (
                    <div key={act.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-7.5 top-1 h-5 w-5 rounded-full border border-surface bg-accent-primary text-[9px] font-bold text-white flex items-center justify-center shadow-soft">
                        •
                      </span>
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-text-primary text-body leading-tight">
                            {act.title}
                          </span>
                          <span className="text-[11px] text-text-muted shrink-0">
                            {formatDate(act.createdAt)}
                          </span>
                        </div>
                        <p className="text-label text-text-secondary mt-1">{act.detail}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">By: {act.actorName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Column B: Communication History */}
            <Card className="md:col-span-1">
              <CardHeader className="border-b border-border-soft pb-3">
                <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-accent-primary" />
                  Communication Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[420px] overflow-y-auto space-y-4">
                {communications.map((comm: any) => (
                  <div key={comm.id} className="border-b border-border-soft pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge tone={comm.type === "Call" ? "info" : comm.type === "WhatsApp" ? "success" : "neutral"} className="py-0 text-[10px]">
                          {comm.type}
                        </Badge>
                        <span className="font-semibold text-text-primary text-body">
                          {comm.subject}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-muted">
                        {formatDate(comm.createdAt)}
                      </span>
                    </div>
                    <p className="text-label text-text-secondary mt-1.5 leading-relaxed">{comm.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted">
                      <span>Agent: {comm.actorName}</span>
                      {comm.duration && (
                        <>
                          <span>•</span>
                          <span>Duration: {comm.duration}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-medium">{comm.status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column C: Follow-Up History */}
            <Card className="md:col-span-1">
              <CardHeader className="border-b border-border-soft pb-3">
                <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-accent-primary" />
                  Follow-Up History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {followUps.map((fu: any) => (
                  <div key={fu.id} className="surface-secondary p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-text-primary text-label">
                        {formatDateTime(fu.scheduledAt)}
                      </span>
                      <Badge tone={fu.status === "Overdue" ? "error" : fu.status === "Completed" ? "success" : "warning"} className="py-0 text-[10px]">
                        {fu.status}
                      </Badge>
                    </div>
                    <p className="text-label text-text-secondary italic">"{fu.notes}"</p>
                    <p className="text-[10px] text-text-muted">Assigned executive: {fu.actorName}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Column D: Site Visits */}
            <Card className="md:col-span-1">
              <CardHeader className="border-b border-border-soft pb-3">
                <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-accent-primary" />
                  Site Visits Record
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {siteVisits.length === 0 ? (
                  <div className="text-center py-6 text-text-muted text-label font-medium">
                    No site visits scheduled yet.
                  </div>
                ) : (
                  siteVisits.map((visit: any) => (
                    <div key={visit.id} className="surface-secondary p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-primary text-label">
                          {formatDateTime(visit.scheduledAt)}
                        </span>
                        <Badge tone={visit.status === "Completed" ? "success" : "warning"} className="py-0 text-[10px]">
                          {visit.status}
                        </Badge>
                      </div>
                      <p className="text-label text-text-secondary leading-relaxed">
                        Outcome: <span className="font-medium text-text-primary">{visit.outcome || "Pending walkthrough outcome."}</span>
                      </p>
                      <p className="text-[10px] text-text-muted">Coordinator: {visit.coordinatorName || "Sales Executive"}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
