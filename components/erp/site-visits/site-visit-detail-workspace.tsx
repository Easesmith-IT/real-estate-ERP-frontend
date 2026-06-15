"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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
  CheckCircle,
  XCircle,
  HelpCircle,
  CalendarClock,
  Sparkles,
  Bell,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { useUiStore } from "@/store/ui-store";
import type { SiteVisit } from "@/lib/erp-types";

interface LeadSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  stage: string;
  budgetMax: number;
  communications?: Array<{ type: string; summary?: string; detail?: string; createdAt: string }>;
}

interface ProjectSummary {
  id: string;
  name: string;
  location: string;
  type: string;
  towers?: Array<{ id: string; name: string }>;
}

interface CoordinatorSummary {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface SiteVisitDetailWorkspaceProps {
  visitId: string;
}

export function SiteVisitDetailWorkspace({ visitId }: SiteVisitDetailWorkspaceProps) {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newSchedule, setNewSchedule] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFollowUp, setNewFollowUp] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // 1. Fetch Site Visit Detail from backend
  const visitQuery = useQuery({
    queryKey: ["erp-site-visit-detail", visitId, role],
    queryFn: async () => {
      const res = await apiRequest<{
        visit: SiteVisit;
        lead: LeadSummary | null;
        project: ProjectSummary | null;
        coordinator: CoordinatorSummary | null;
      }>(`/api/leads/site-visits/${visitId}`, { role });
      return res.data;
    },
  });

  // 2. Mutation to update site visit properties (status, date, notes)
  const updateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return apiRequest(`/api/leads/site-visits/${visitId}`, {
        role,
        method: "PATCH",
        body,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-site-visit-detail", visitId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-site-visits"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
      ]);
      setIsRescheduling(false);
      setIsEditingNotes(false);
    },
  });

  if (visitQuery.isLoading) return <LoadingStateCard title="Loading site visit profile..." />;
  if (visitQuery.isError || !visitQuery.data) {
    return <ErrorStateCard message="Site visit details could not be loaded from the ERP backend." />;
  }

  const { visit, lead, project, coordinator } = visitQuery.data;

  const getStatusTone = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "info";
      case "Confirmed":
        return "info";
      case "Completed":
        return "success";
      case "Cancelled":
        return "error";
      case "No Show":
        return "warning";
      default:
        return "neutral";
    }
  };

  const formatDateTimeLocal = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getTimelineEvents = () => {
    const events = [];
    if (visit.createdAt) {
      events.push({
        title: "Visit Created",
        time: formatDateTimeLocal(visit.createdAt),
        desc: "Site visit logged in system",
        done: true,
      });
    }
    if (visit.status === "Confirmed" || visit.status === "Completed") {
      events.push({
        title: "Visit Confirmed",
        time: formatDateTimeLocal(visit.scheduledAt),
        desc: `Client confirmed schedule with coordinator ${visit.coordinatorName}`,
        done: true,
      });
    }
    if (visit.status === "Completed") {
      events.push({
        title: "Tour Completed",
        time: formatDateTimeLocal(new Date(visit.scheduledAt).getTime() + 3600000 + ""), // Approximate 1 hr later
        desc: visit.outcome || "Shortlisted unit plans and completed model tour.",
        done: true,
      });
    } else if (visit.status === "No Show") {
      events.push({
        title: "No-Show Flagged",
        time: formatDateTimeLocal(visit.scheduledAt),
        desc: "Lead did not arrive at site. Attempting to contact for reschedule.",
        done: false,
        warn: true,
      });
    } else if (visit.status === "Cancelled") {
      events.push({
        title: "Cancelled",
        time: formatDateTimeLocal(visit.scheduledAt),
        desc: "Schedule cancelled by client request.",
        done: false,
        err: true,
      });
    } else {
      events.push({
        title: "Tour Scheduled",
        time: formatDateTimeLocal(visit.scheduledAt),
        desc: `Assigned to ${visit.coordinatorName}`,
        done: false,
      });
    }
    return events;
  };

  const handleUpdateStatus = (status: string) => {
    updateMutation.mutate({ status });
  };

  const handleSaveReschedule = () => {
    if (!newSchedule) return;
    updateMutation.mutate({ scheduledAt: newSchedule });
  };

  const handleSaveNotes = () => {
    updateMutation.mutate({
      notes: newNotes,
      followUpDate: newFollowUp || undefined,
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/sales/site-visits">
            <Button variant="outline" size="sm" className="h-9 px-2.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-section-title font-secondary font-bold text-text-primary">
                Visit Profile: {visit.leadName}
              </h1>
              <Badge tone={getStatusTone(visit.status)} className="capitalize py-0.5 px-2.5">
                {visit.status}
              </Badge>
            </div>
            <p className="text-label text-text-muted mt-1">
              Visit ID: <code className="bg-hover px-1.5 py-0.5 rounded text-[11px]">{visit.id}</code> &bull; Created {formatDateTimeLocal(visit.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visit.status !== "Completed" && visit.status !== "Cancelled" && (
            <>
              <Button
                variant="primary"
                size="sm"
                className="bg-success hover:bg-success/95 border-none"
                onClick={() => handleUpdateStatus("Completed")}
                loading={updateMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                Complete Visit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsRescheduling(!isRescheduling);
                  setNewSchedule(visit.scheduledAt.slice(0, 16));
                }}
              >
                <CalendarClock className="h-4 w-4" />
                Reschedule
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdateStatus("Cancelled")}
                loading={updateMutation.isPending}
              >
                <XCircle className="h-4 w-4" />
                Cancel Visit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus("No Show")}
                loading={updateMutation.isPending}
              >
                <HelpCircle className="h-4 w-4 text-warning" />
                Mark No Show
              </Button>
            </>
          )}
          {visit.status === "Scheduled" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus("Confirmed")}
              loading={updateMutation.isPending}
            >
              Confirm Visit
            </Button>
          )}
        </div>
      </div>

      {isRescheduling && (
        <Card className="border border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="py-4 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-label text-text-secondary font-medium">Choose New Date and Time</label>
              <Input
                type="datetime-local"
                value={newSchedule}
                onChange={(e) => setNewSchedule(e.target.value)}
                className="bg-surface"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveReschedule} loading={updateMutation.isPending}>
                Save Schedule
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsRescheduling(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Detail profiles & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Info */}
            <Card className="hover:shadow-soft transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-body font-semibold">
                  <User className="h-4 w-4 text-accent-primary" />
                  Lead Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                  <span className="text-label text-text-secondary">Name</span>
                  <span className="text-body font-bold text-text-primary">{visit.leadName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                  <span className="text-label text-text-secondary">Phone</span>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-body text-text-primary">{lead?.phone || "N/A"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                  <span className="text-label text-text-secondary">Email</span>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-body text-text-primary truncate max-w-[180px]">{lead?.email || "N/A"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                  <span className="text-label text-text-secondary">Lead Stage</span>
                  <Badge tone={lead?.stage === "Closed Won" ? "success" : "info"}>{lead?.stage || "N/A"}</Badge>
                </div>
                {lead?.budgetMax && (
                  <div className="flex items-center justify-between">
                    <span className="text-label text-text-secondary">Deal Budget</span>
                    <div className="flex items-center gap-1 font-bold text-text-primary">
                      <Coins className="h-3.5 w-3.5 text-warning" />
                      <span>₹{(lead.budgetMax / 100000).toFixed(0)} L</span>
                    </div>
                  </div>
                )}
                {lead && (
                  <div className="pt-2">
                    <Link href={`/sales/leads/${lead.id}`}>
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-between text-accent-primary hover:text-accent-primary-hover">
                        <span>Go to Lead Profile</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card className="hover:shadow-soft transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-body font-semibold">
                  <Building className="h-4 w-4 text-accent-secondary" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                  <span className="text-label text-text-secondary">Project Name</span>
                  <span className="text-body font-bold text-text-primary">{visit.projectName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                  <span className="text-label text-text-secondary">Location</span>
                  <div className="flex items-center gap-1 text-text-primary">
                    <MapPin className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-body truncate max-w-[180px]">{project?.location || "Sector 62, Gurgaon"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                  <span className="text-label text-text-secondary">Type</span>
                  <span className="text-body text-text-primary">{project?.type || "Residential Tower"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label text-text-secondary">Units Handled</span>
                   <span className="text-body font-bold text-text-primary">{project?.towers ? project.towers.length * 40 : "120 Units"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes & Outcomes */}
          <Card className="hover:shadow-soft transition-all duration-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-body font-semibold">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                Notes & Visit Outcomes
              </CardTitle>
              {!isEditingNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingNotes(true);
                    setNewNotes(visit.notes || "");
                    setNewFollowUp((visit.followUpDate || "").slice(0, 10));
                  }}
                >
                  Edit Notes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingNotes ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-label text-text-secondary">Visit Notes</label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="h-28 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-2 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]"
                      placeholder="Write notes about the walkthrough, shortlisted inventory, client objections..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-label text-text-secondary">Next Follow-Up Date</label>
                      <Input
                        type="date"
                        value={newFollowUp}
                        onChange={(e) => setNewFollowUp(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" onClick={handleSaveNotes} loading={updateMutation.isPending}>
                      Save Notes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-surface-secondary border border-border-soft p-4 rounded-xl space-y-2">
                    <p className="text-body text-text-primary font-medium leading-relaxed">
                      {visit.notes || "No notes provided for this visit walkthrough."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-label pt-2">
                    <div className="flex items-center gap-2 border border-border-soft p-3 rounded-lg">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-text-muted font-normal">Next Follow-Up</p>
                        <p className="font-semibold text-text-primary mt-0.5">
                          {visit.followUpDate ? new Date(visit.followUpDate).toLocaleDateString("en-IN") : "Not Scheduled"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border border-border-soft p-3 rounded-lg">
                      <Bell className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-text-muted font-normal">Reminder Settings</p>
                        <p className="font-semibold text-text-primary mt-0.5">
                          {visit.reminderSettings?.email ? "Email" : ""}
                          {visit.reminderSettings?.sms ? " & SMS" : ""}
                          {visit.reminderSettings?.whatsapp ? " & WhatsApp" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication History */}
          <Card className="hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-body font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-primary" />
                Related Communication History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {((lead as { communications?: Array<{ type: string; summary?: string; detail?: string; createdAt: string }> })?.communications && 
               ((lead as { communications?: Array<{ type: string; summary?: string; detail?: string; createdAt: string }> })?.communications || []).length > 0) ? (
                <div className="space-y-3">
                  {((lead as { communications?: Array<{ type: string; summary?: string; detail?: string; createdAt: string }> })?.communications || []).slice(0, 5).map((comm: { type: string; summary?: string; detail?: string; createdAt: string }, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start border-b border-border-soft pb-3 last:border-0 last:pb-0">
                      <Badge tone={comm.type === "Call" ? "info" : comm.type === "WhatsApp" ? "success" : "neutral"} className="py-0.5 px-2 shrink-0">
                        {comm.type}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-body text-text-primary font-medium">{comm.summary || comm.detail}</p>
                        <p className="text-label text-text-muted mt-0.5">{formatDateTimeLocal(comm.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body text-text-secondary text-center py-6">
                  No communication records registered for this lead.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Scorecard & Timeline */}
        <div className="space-y-6">
          {/* Booking Potential */}
          <Card className="border-border-soft bg-linear-to-b from-accent-primary/5 via-surface to-surface hover:shadow-soft transition-all duration-200 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-body font-semibold">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Booking Potential
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="rgba(15,23,42,0.06)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - (visit.conversionScore || 75) / 100)}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[28px] font-bold text-text-primary tracking-tight">
                    {visit.conversionScore || 75}%
                  </span>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                    Score
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-left">
                <h4 className="text-label font-bold text-text-primary uppercase tracking-wider">Potential Diagnostics</h4>
                <ul className="text-label text-text-secondary space-y-1.5 list-disc pl-4 leading-normal">
                  <li>Client fits project budget brackets.</li>
                  <li>Showed positive engagement during unit tour.</li>
                  <li>High demand for preferred layout.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Coordinator Card */}
          <Card className="hover:shadow-soft transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-body font-semibold">
                <Award className="h-4 w-4 text-warning" />
                Assigned Coordinator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-secondary flex items-center justify-center font-bold text-text-primary border border-border-soft">
                  {visit.coordinatorName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-body font-bold text-text-primary">{visit.coordinatorName}</h4>
                  <p className="text-label text-text-muted capitalize">{coordinator?.role || "Site Executive"}</p>
                </div>
              </div>
              <div className="border-t border-border-soft pt-3 text-label space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Email</span>
                  <span className="text-text-primary truncate max-w-[170px]">{coordinator?.email || "sales@erp.com"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Experience Level</span>
                  <span className="text-text-primary">Senior Tour Specialist</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit Timeline */}
          <Card className="hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-body font-semibold">Visit Progress Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 relative pl-4 border-l border-border-soft">
                {getTimelineEvents().map((event, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[20.5px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-surface ${
                        event.done
                          ? "border-success bg-success/10"
                          : event.warn
                          ? "border-warning bg-warning/10"
                          : event.err
                          ? "border-error bg-error/10"
                          : "border-text-muted bg-surface-secondary"
                      }`}
                    />
                    <div>
                      <h4 className={`text-label font-bold ${event.done ? "text-text-primary" : "text-text-secondary"}`}>
                        {event.title}
                      </h4>
                      <p className="text-label text-text-muted mt-0.5">{event.time}</p>
                      <p className="text-label text-text-secondary mt-1 leading-normal">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
