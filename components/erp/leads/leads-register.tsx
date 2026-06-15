"use client";
import { toast } from "@/components/ui/toast";

import { useDeferredValue, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  Edit2,
  Calendar,
  ChevronRight,
  User,
} from "lucide-react";
import { Lead } from "@/lib/erp-types";
import { formatDate } from "@/lib/erp-utils";

interface Project {
  id: string;
  name: string;
}

interface Executive {
  id: string;
  name: string;
}

interface LeadsRegisterProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  projects: Project[];
  executives: Executive[];
  onView: (leadId: string) => void;
  onEdit: (lead: Lead) => void;
  onAdvanceStage: (leadId: string, currentStage: string) => void;
  onScheduleVisit: (leadId: string) => void;
}

export function LeadsRegister({
  leads,
  isLoading,
  projects,
  executives,
  onView,
  onEdit,
  onAdvanceStage,
  onScheduleVisit,
}: LeadsRegisterProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  // Filters state
  const [stageFilter, setStageFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [budgetFilter, setBudgetFilter] = useState("All");

  const resetFilters = () => {
    setSearch("");
    setStageFilter("All");
    setOwnerFilter("All");
    setSourceFilter("All");
    setBudgetFilter("All");
  };

  const getLeadScore = (lead: Lead) => {
    const stage = lead.stage;
    if (stage === "Closed Won" || stage === "Booking" || stage === "Negotiation") {
      return { label: "Hot Lead", bg: "bg-red-500/10 text-red-500 border-red-500/20" };
    }
    if (stage === "Site Visit Scheduled" || stage === "Interested") {
      return { label: "Warm Lead", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    }
    if (stage === "Closed Lost") {
      return { label: "Cold Lead", bg: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
    }
    return { label: "Qualified", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
  };

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

  // Filter logic
  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    return leads.filter((lead) => {
      // 1. Search
      const searchStr = `${lead.fullName} ${lead.projectName} ${lead.source}`.toLowerCase();
      if (deferredSearch && !searchStr.includes(deferredSearch.toLowerCase())) {
        return false;
      }

      // 2. Stage
      if (stageFilter !== "All" && lead.stage !== stageFilter) {
        return false;
      }

      // 3. Owner
      if (ownerFilter !== "All" && lead.assignedTo !== ownerFilter) {
        return false;
      }

      // 4. Source
      if (sourceFilter !== "All" && lead.source !== sourceFilter) {
        return false;
      }

      // 5. Budget Filter
      if (budgetFilter !== "All") {
        const budget = lead.budgetMax || 0;
        if (budgetFilter === "under50L" && budget >= 5000000) return false;
        if (budgetFilter === "50Lto1Cr" && (budget < 5000000 || budget >= 10000000)) return false;
        if (budgetFilter === "1Crto2Cr" && (budget < 10000000 || budget > 20000000)) return false;
        if (budgetFilter === "above2Cr" && budget <= 20000000) return false;
      }

      return true;
    });
  }, [leads, deferredSearch, stageFilter, ownerFilter, sourceFilter, budgetFilter]);

  const handleExport = () => {
    toast.info(`Exporting ${filteredLeads.length} leads data to CSV format...`);
  };

  const selectClass =
    "h-10 rounded-[var(--radius-button)] border border-border-soft bg-surface px-3 text-label text-text-primary shadow-soft focus-visible:outline-none focus-visible:border-accent-primary";

  const sources = [
    "Website",
    "Google Ads",
    "Referral",
    "Broker Referral",
    "Walk-in",
    "WhatsApp",
    "Meta Campaign",
    "Channel Partner",
  ];

  const stages = [
    "New",
    "Contacted",
    "Interested",
    "Site Visit Scheduled",
    "Negotiation",
    "Booking",
    "Closed Won",
    "Closed Lost",
  ];

  return (
    <Card className="hover:shadow-soft transition-all duration-200">
      {/* Table Toolbar */}
      <div className="border-b border-border-soft bg-surface-secondary/80 px-4 py-4 rounded-t-[var(--radius-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex min-w-[280px] flex-1 items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search leads by name, project, source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 bg-surface pl-9 border-border-soft rounded-[var(--radius-button)] shadow-soft focus-visible:border-accent-primary"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="text-label h-10 border-border-strong text-text-secondary hover:bg-surface hover:text-text-primary gap-1.5"
              onClick={resetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-label h-10 border-border-strong text-text-secondary hover:bg-surface hover:text-text-primary gap-1.5"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-label text-text-muted font-medium flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Stage:
            </span>
            <select
              className={selectClass}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="All">All Stages</option>
              {stages.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-label text-text-muted font-medium">Owner:</span>
            <select
              className={selectClass}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="All">All Owners</option>
              {executives.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-label text-text-muted font-medium">Source:</span>
            <select
              className={selectClass}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="All">All Sources</option>
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-label text-text-muted font-medium">Budget:</span>
            <select
              className={selectClass}
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
            >
              <option value="All">All Budgets</option>
              <option value="under50L">Below ₹50L</option>
              <option value="50Lto1Cr">₹50L - ₹1Cr</option>
              <option value="1Crto2Cr">₹1Cr - ₹2Cr</option>
              <option value="above2Cr">Above ₹2Cr</option>
            </select>
          </div>
          
          <span className="text-label text-text-muted ml-auto font-medium">
            Found {filteredLeads.length} leads
          </span>
        </div>
      </div>

      {/* Leads Table */}
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-soft bg-surface-secondary/40 text-label text-text-muted font-semibold">
              <th className="px-6 py-4">Lead</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Budget Range</th>
              <th className="px-6 py-4">Stage</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Follow-Up</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft text-table text-text-secondary">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={9} className="px-6 py-6 h-12 bg-surface-secondary" />
                </tr>
              ))
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-body text-text-muted font-medium">
                  No matching leads found in register.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const score = getLeadScore(lead);
                const isOverdue =
                  !["Closed Won", "Closed Lost"].includes(lead.stage) &&
                  lead.followUpAt &&
                  new Date(lead.followUpAt) < new Date();

                return (
                  <tr key={lead.id} className="hover:bg-surface-secondary/30 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-accent-primary/10 text-accent-primary p-2 h-10 w-10 flex items-center justify-center font-bold">
                          {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary text-body">{lead.fullName}</p>
                          <p className="text-label text-text-muted">{lead.phone} • {lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {lead.projectName}
                    </td>
                    <td className="px-6 py-4">{lead.source}</td>
                    <td className="px-6 py-4 font-medium">{lead.budgetLabel}</td>
                    <td className="px-6 py-4">
                      <Badge tone={getStageTone(lead.stage)} className="font-medium text-label uppercase py-0.5">
                        {lead.stage}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-label font-bold border ${score.bg}`}>
                        {score.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <User className="h-4 w-4 text-text-muted" />
                        <span>{lead.assignedToName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-semibold ${isOverdue ? "text-red-500" : "text-text-primary"}`}>
                          {formatDate(lead.followUpAt)}
                        </p>
                        {isOverdue && <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider">Overdue</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-text-muted hover:bg-surface-secondary hover:text-accent-primary"
                          onClick={() => onView(lead.id)}
                          title="View Lead Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-text-muted hover:bg-surface-secondary hover:text-accent-primary"
                          onClick={() => onEdit(lead)}
                          title="Edit Lead"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {lead.stage !== "Closed Won" && lead.stage !== "Closed Lost" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-text-muted hover:bg-surface-secondary hover:text-success"
                              onClick={() => onAdvanceStage(lead.id, lead.stage)}
                              title="Advance Lead Stage"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-text-muted hover:bg-surface-secondary hover:text-warning"
                              onClick={() => onScheduleVisit(lead.id)}
                              title="Schedule Site Visit"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
