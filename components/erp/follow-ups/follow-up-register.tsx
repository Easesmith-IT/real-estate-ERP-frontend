"use client";
import { toast } from "@/components/ui/toast";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  RotateCcw,
  Download,
  Phone,
  MessageCircle,
  Eye,
  Edit,
  Check,
  CalendarDays,
  Trash,
} from "lucide-react";
import { Lead, ProjectSummary, DemoUser, SiteVisit } from "@/lib/erp-types";
import { formatDate, formatDateTime, toneForStage, toneForStatus } from "@/lib/erp-utils";

interface FollowUpRegisterProps {
  leads: Lead[];
  projects: ProjectSummary[];
  executives: DemoUser[];
  visits: SiteVisit[];
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onAdvanceStage: (leadId: string, stage: string) => void;
  onReschedule: (lead: Lead) => void;
}

const selectClassName =
  "h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export function FollowUpRegister({
  leads,
  projects,
  executives,
  visits,
  onEdit,
  onDelete,
  onAdvanceStage,
  onReschedule,
}: FollowUpRegisterProps) {
  const router = useRouter();

  // Filters state
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [visitLinkedOnly, setVisitLinkedOnly] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setOwnerFilter("All");
    setPriorityFilter("All");
    setProjectFilter("All");
    setSourceFilter("All");
    setStatusFilter("All");
    setStageFilter("All");
    setOverdueOnly(false);
    setVisitLinkedOnly(false);
    setPage(1);
  };

  // Derive parameters from lists
  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source))).sort(), [leads]);
  const stages = useMemo(() => Array.from(new Set(leads.map((l) => l.stage))).sort(), [leads]);
  const visitLeadIds = useMemo(() => new Set(visits.map((v) => v.leadId)), [visits]);

  // Compute lead priority level
  const getPriority = (lead: Lead) => {
    if (lead.budgetMax >= 25000000) return "Critical";
    if (lead.budgetMax >= 15000000) return "High";
    if (lead.budgetMax < 5000000) return "Low";
    return "Medium";
  };

  // Filter logic
  const filteredLeads = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toDateString();

    return leads.filter((lead) => {
      // 1. Search text
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        lead.fullName.toLowerCase().includes(needle) ||
        lead.projectName.toLowerCase().includes(needle) ||
        lead.phone.includes(needle);

      // 2. Owner
      const matchesOwner = ownerFilter === "All" || lead.assignedTo === ownerFilter;

      // 3. Priority
      const prio = getPriority(lead);
      const matchesPriority = priorityFilter === "All" || prio === priorityFilter;

      // 4. Project
      const matchesProject = projectFilter === "All" || lead.preferredProjectId === projectFilter;

      // 5. Source
      const matchesSource = sourceFilter === "All" || lead.source === sourceFilter;

      // 6. Stage
      const matchesStage = stageFilter === "All" || lead.stage === stageFilter;

      // 7. Overdue indicator
      const isOverdue =
        !["Closed Won", "Closed Lost"].includes(lead.stage) &&
        new Date(lead.followUpAt).getTime() < now;
      const matchesOverdue = !overdueOnly || isOverdue;

      // 8. Visit Linked
      const isLinked = visitLeadIds.has(lead.id);
      const matchesVisit = !visitLinkedOnly || isLinked;

      // 9. Status
      const isToday = new Date(lead.followUpAt).toDateString() === todayStr;
      let leadStatus = "Scheduled";
      if (["Closed Won", "Booking"].includes(lead.stage)) {
        leadStatus = "Completed";
      } else if (isOverdue) {
        leadStatus = "Missed";
      } else if (lead.notes?.toLowerCase().includes("reschedule")) {
        leadStatus = "Rescheduled";
      }
      const matchesStatus = statusFilter === "All" || leadStatus === statusFilter;

      return (
        matchesSearch &&
        matchesOwner &&
        matchesPriority &&
        matchesProject &&
        matchesSource &&
        matchesStage &&
        matchesOverdue &&
        matchesVisit &&
        matchesStatus
      );
    });
  }, [
    leads,
    search,
    ownerFilter,
    priorityFilter,
    projectFilter,
    sourceFilter,
    stageFilter,
    overdueOnly,
    visitLinkedOnly,
    statusFilter,
    visitLeadIds,
  ]);

  // Paginated chunk
  const paginatedLeads = useMemo(() => {
    const startIdx = (page - 1) * rowsPerPage;
    return filteredLeads.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredLeads, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage) || 1;

  // Handlers for click actions
  const handleCall = (phone: string) => {
    toast.info(`Initiating click-to-call dialer for ${phone} via ERP VoIP integration...`);
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hi ${name}, this is regarding your real estate inquiry on easesmith ERP.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,Lead,Phone,Project,Source,Stage,Priority,FollowUpDate,FollowUpTime,Owner,Notes\n" +
      filteredLeads.map((l) => `"${l.fullName}","${l.phone}","${l.projectName}","${l.source}","${l.stage}","${getPriority(l)}","${l.followUpAt.split("T")[0]}","${l.followUpAt.split("T")[1]?.slice(0,5)}","${l.assignedToName}","${(l.notes || "").replace(/"/g, '""')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `follow_ups_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden border-border-soft bg-surface">
      <CardHeader className="pb-3 border-b border-border-soft flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle className="text-card-title font-semibold text-text-primary">
            Follow-Up Operations Ledger
          </CardTitle>
          <p className="text-label text-text-muted">Filtered workspace register to log dials, view details, reschedule tasks, or advance stages.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="border-border-strong text-text-secondary gap-1.5 h-9">
          <Download className="h-4 w-4" />
          <span>Export Ledger</span>
        </Button>
      </CardHeader>
      
      {/* Filters Toolbar */}
      <div className="bg-surface-secondary border-b border-border-soft p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search lead, project, or phone"
              className="h-11 bg-surface pl-9"
            />
          </div>

          {/* Project */}
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className={selectClassName}
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Owner */}
          <select
            value={ownerFilter}
            onChange={(e) => {
              setOwnerFilter(e.target.value);
              setPage(1);
            }}
            className={selectClassName}
          >
            <option value="All">All Owners</option>
            {executives.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className={selectClassName}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Stage */}
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className={selectClassName}
          >
            <option value="All">All Stages</option>
            {stages.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={selectClassName}
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Missed">Missed</option>
          </select>
        </div>

        {/* Checkbox Segment & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1.5 border-t border-border-soft">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-label text-text-primary font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-border-strong text-accent-primary focus:ring-accent-primary"
              />
              <span>Overdue Tasks Only</span>
            </label>

            <label className="flex items-center gap-2 text-label text-text-primary font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visitLinkedOnly}
                onChange={(e) => {
                  setVisitLinkedOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-border-strong text-accent-primary focus:ring-accent-primary"
              />
              <span>Visit Linked Only</span>
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-label text-text-muted font-bold">
              Found {filteredLeads.length} ledger records
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9 border-border-strong text-text-secondary gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <CardContent className="px-0 pb-0 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-table">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr className="h-12 border-b border-border-soft">
                <th className="px-4 text-left font-semibold">Lead</th>
                <th className="px-4 text-left font-semibold">Project</th>
                <th className="px-4 text-left font-semibold">Source</th>
                <th className="px-4 text-left font-semibold">Stage</th>
                <th className="px-4 text-left font-semibold">Priority</th>
                <th className="px-4 text-left font-semibold">Follow-Up Date</th>
                <th className="px-4 text-left font-semibold">Time</th>
                <th className="px-4 text-left font-semibold">Owner</th>
                <th className="px-4 text-left font-semibold">Last Contact</th>
                <th className="px-4 text-left font-semibold">Next Action</th>
                <th className="px-4 text-left font-semibold">Status</th>
                <th className="px-4 text-left font-semibold">Notes Preview</th>
                <th className="px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr className="h-32">
                  <td colSpan={13} className="text-center text-body text-text-muted font-medium">
                    No follow-up records found matching the active filter bench.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const now = Date.now();
                  const isOverdue =
                    !["Closed Won", "Closed Lost"].includes(lead.stage) &&
                    new Date(lead.followUpAt).getTime() < now;
                  const isToday =
                    new Date(lead.followUpAt).toDateString() === new Date().toDateString();
                  const isLinked = visitLeadIds.has(lead.id);
                  const prio = getPriority(lead);
                  
                  // Calculate days overdue
                  const diffMs = now - new Date(lead.followUpAt).getTime();
                  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                  const needsReschedule = isOverdue && diffDays >= 2;

                  // Next Action
                  let nextAction = "Call to qualify";
                  if (lead.stage === "Site Visit Scheduled") nextAction = "Execute walkthrough";
                  else if (lead.stage === "Interested") nextAction = "Schedule visit";
                  else if (lead.stage === "Negotiation") nextAction = "Obtain offer sign-off";

                  // Status
                  let leadStatus = "Scheduled";
                  if (["Closed Won", "Booking"].includes(lead.stage)) {
                    leadStatus = "Completed";
                  } else if (isOverdue) {
                    leadStatus = "Missed";
                  } else if (lead.notes?.toLowerCase().includes("reschedule")) {
                    leadStatus = "Rescheduled";
                  }

                  return (
                    <tr key={lead.id} className="border-t border-border-soft hover:bg-hover/40 transition-colors duration-150">
                      {/* Lead */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-text-primary">{lead.fullName}</p>
                          <p className="text-label text-text-muted">{lead.phone}</p>
                        </div>
                      </td>
                      {/* Project */}
                      <td className="px-4 py-3.5 text-text-secondary">{lead.projectName}</td>
                      {/* Source */}
                      <td className="px-4 py-3.5 text-text-secondary">{lead.source}</td>
                      {/* Stage */}
                      <td className="px-4 py-3.5">
                        <Badge tone={toneForStage(lead.stage)}>{lead.stage}</Badge>
                      </td>
                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        <Badge
                          tone={
                            prio === "Critical"
                              ? "error"
                              : prio === "High"
                                ? "warning"
                                : prio === "Low"
                                  ? "neutral"
                                  : "info"
                          }
                          className="font-bold uppercase tracking-wider text-[9px] py-0"
                        >
                          {prio}
                        </Badge>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3.5 text-text-secondary">
                        {lead.followUpAt.split("T")[0] || formatDate(lead.followUpAt)}
                      </td>
                      {/* Time */}
                      <td className="px-4 py-3.5 text-text-secondary">
                        {lead.followUpAt.split("T")[1]?.slice(0, 5) || "12:00"}
                      </td>
                      {/* Owner */}
                      <td className="px-4 py-3.5 font-medium text-text-primary">{lead.assignedToName}</td>
                      {/* Last Contact */}
                      <td className="px-4 py-3.5 text-text-muted">{formatDate(lead.updatedAt)}</td>
                      {/* Next Action */}
                      <td className="px-4 py-3.5 font-medium text-text-secondary italic">{nextAction}</td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge tone={toneForStatus(leadStatus)} className="font-bold">
                          {leadStatus}
                        </Badge>
                      </td>
                      {/* Notes Preview */}
                      <td className="px-4 py-3.5 max-w-[200px] truncate text-text-muted" title={lead.notes}>
                        {lead.notes || "No communication notes."}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          {/* Row Badges in actions slot or row overlay */}
                          {isOverdue && <span className="mr-1 inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase text-red-600 border border-red-500/20">Overdue</span>}
                          {isToday && <span className="mr-1 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-600 border border-amber-500/20">Due Today</span>}
                          {isLinked && <span className="mr-1 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-600 border border-emerald-500/20">Linked</span>}
                          {needsReschedule && <span className="mr-1 inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase text-purple-600 border border-purple-500/20">Resched Req</span>}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/sales/follow-ups/${lead.id}`)}
                            title="View Action Center Profile"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(lead)}
                            title="Edit Follow-Up"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onReschedule(lead)}
                            title="Reschedule Follow-Up"
                            className="h-8 w-8 p-0 text-amber-500"
                          >
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCall(lead.phone)}
                            title="Call Lead"
                            className="h-8 w-8 p-0 text-blue-500"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleWhatsApp(lead.phone, lead.fullName)}
                            title="WhatsApp message"
                            className="h-8 w-8 p-0 text-green-500"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(lead.id)}
                            title="Delete Lead"
                            className="h-8 w-8 p-0 hover:text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4.5 bg-surface-secondary border-t border-border-soft">
            <div className="flex items-center gap-2">
              <span className="text-label text-text-muted">Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded bg-surface border border-border-soft text-label px-2 font-semibold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-label text-text-muted ml-2">
                Showing {Math.min(filteredLeads.length, (page - 1) * rowsPerPage + 1)} to{" "}
                {Math.min(filteredLeads.length, page * rowsPerPage)} of {filteredLeads.length} Follow-Ups
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-9 border-border-strong text-text-secondary"
              >
                Previous
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                return (
                  <Button
                    key={pNum}
                    variant={page === pNum ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setPage(pNum)}
                    className={`h-9 w-9 p-0 ${page === pNum ? "text-white" : "border-border-strong text-text-secondary"}`}
                  >
                    {pNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-9 border-border-strong text-text-secondary"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
