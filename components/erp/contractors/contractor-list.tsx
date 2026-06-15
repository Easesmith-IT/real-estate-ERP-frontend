"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HardHat,
  Users,
  Building2,
  ShieldCheck,
  Star,
  UserCheck,
  Plus,
  Download,
  Upload,
  Briefcase,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import type { ContractorsResponse, PropertySummaryResponse, Contractor, ProjectSummary } from "@/lib/erp-types";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, toneForStatus } from "@/lib/erp-utils";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard } from "@/components/erp/live-state";
import { EnterprisePageLoader } from "@/components/ui/loaders";
import { TableToolbar, TableEmptyStateRow } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ContractorForm, buildContractorFormValues, createEmptyContractorFormValues, validateContractorForm, selectClassName } from "@/components/erp/contractors/contractor-form";
import { ContractorKpiCards, type ContractorKpiItem } from "@/components/erp/contractors/contractor-kpi-cards";
import { ContractorInsights, type ContractorInsight } from "@/components/erp/contractors/contractor-insights";

const rowsPerPageOptions = [20, 50, 100];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-active-soft text-label font-bold text-accent-primary">
      {initials}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5 text-amber-500 font-medium">
      {"★".repeat(fullStars)}
      {halfStar ? "½" : ""}
      {"☆".repeat(emptyStars)}
      <span className="ml-1 text-[11px] text-text-secondary font-semibold">({rating})</span>
    </div>
  );
}

function toneForCompliance(status: string) {
  if (status === "Compliant") return "success" as const;
  if (status === "Pending Review") return "warning" as const;
  return "error" as const;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

function downloadCsv(contractors: Contractor[]) {
  const rows = [
    [
      "Company Name",
      "Trade",
      "Project ID",
      "Workforce Deployed",
      "Contact Person",
      "Phone",
      "Email",
      "GSTIN",
      "PAN",
      "Address",
      "Contract Start",
      "ContractEnd",
      "Rate Type",
      "Rate Value",
      "Compliance Status",
      "Status",
    ],
    ...contractors.map((c) => [
      c.name,
      c.trade,
      c.projectId,
      `${c.workforce}`,
      c.contactPerson || "",
      c.phone || "",
      c.email || "",
      c.gstin || "",
      c.pan || "",
      c.address || "",
      c.contractStart || "",
      c.contractEnd || "",
      c.rateType || "Daily",
      `${c.rateValue || 0}`,
      c.complianceStatus || "Compliant",
      c.status,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${`${value}`.replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "contractors-intelligence-export.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const parseRow = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (character === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += character;
      }
    }

    values.push(current.trim());
    return values;
  };

  const headers = parseRow(lines[0]).map((header) => header.toLowerCase().replace(/\s/g, ""));

  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    return headers.reduce<Record<string, string>>((result, header, index) => {
      result[header] = values[index] || "";
      return result;
    }, {});
  });
}

export function ContractorList() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const contractorsQuery = useQuery({
    queryKey: ["erp-contractors", role],
    queryFn: async () => (await apiRequest<ContractorsResponse>("/api/workforce/contractors", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  // Drawer states
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContractorId, setEditingContractorId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(createEmptyContractorFormValues());
  const [formErrors, setFormErrors] = useState({});

  // Toolbar & filter states
  const [searchValue, setSearchValue] = useState("");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [complianceFilter, setComplianceFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Import states
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(
        editingContractorId ? `/api/workforce/contractors/${editingContractorId}` : "/api/workforce/contractors",
        {
          role,
          method: editingContractorId ? "PATCH" : "POST",
          body: {
            ...formValues,
            workforce: Number(formValues.workforce) || 0,
            rateValue: Number(formValues.rateValue) || 0,
          },
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-contractors"] });
      setDrawerOpen(false);
      setEditingContractorId(null);
      setFormValues(createEmptyContractorFormValues());
      setFormErrors({});
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (contractorId: string) =>
      apiRequest(`/api/workforce/contractors/${contractorId}`, {
        role,
        method: "PATCH",
        body: { status: "Closed" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-contractors"] });
    },
  });

  // Handle resets
  const handleResetFilters = () => {
    setSearchValue("");
    setTradeFilter("All");
    setStatusFilter("All");
    setComplianceFilter("All");
    setProjectFilter("All");
    setCurrentPage(1);
  };

  // Import functionality
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage("Reading upload package...");

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        throw new Error("No data found in file.");
      }

      setImportMessage(`Importing ${rows.length} records...`);
      for (const row of rows) {
        const payload = {
          name: row.companyname || row.name || "Unknown Company",
          trade: row.trade || "Civil",
          projectId: row.projectid || projectList[0]?.id || "",
          workforce: Number(row.workforcedeployed || row.workforce) || 0,
          status: row.status || "Engaged",
          contactPerson: row.contactperson || "",
          phone: row.phone || "",
          email: row.email || "",
          gstin: row.gstin || "",
          pan: row.pan || "",
          address: row.address || "",
          contractStart: row.contractstart || "",
          contractEnd: row.contractend || "",
          rateType: row.ratetype || "Daily",
          rateValue: Number(row.ratevalue) || 0,
          complianceStatus: row.compliancestatus || "Compliant",
        };

        await apiRequest("/api/workforce/contractors", {
          role,
          method: "POST",
          body: payload,
        });
      }

      setImportMessage("Workforce network updated successfully!");
      await queryClient.invalidateQueries({ queryKey: ["erp-contractors"] });
    } catch (err: any) {
      setImportMessage(`Import failed: ${err.message || "Invalid structure"}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportMessage(null), 4000);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  if (contractorsQuery.isLoading || projectsQuery.isLoading) {
    return <EnterprisePageLoader title="Contractor Intelligence Center" variant="table" />;
  }
  if (contractorsQuery.error || projectsQuery.error || !contractorsQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Contractor information is currently unavailable." />;
  }

  const contractorList = contractorsQuery.data.contractors || [];
  const projectList = projectsQuery.data.projects || [];

  // 1. Calculate metrics for KPIs
  const activeCount = contractorList.filter((c) => c.status !== "Closed").length;
  const totalWorkforce = contractorList.reduce((acc, c) => acc + (c.workforce || 0), 0);
  const projectsCount = new Set(contractorList.map((c) => c.projectId).filter(Boolean)).size;
  
  const compliantCount = contractorList.filter((c) => c.complianceStatus === "Compliant").length;
  const complianceScore = contractorList.length > 0 ? Math.round((compliantCount / contractorList.length) * 100) : 100;
  
  const ratings = contractorList.map((c) => c.rating || 4.5);
  const avgRating = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 4.5;
  const availabilityPercent = 95; // Demo baseline

  // Sparkline seeds
  const activeSparkline = [35, 38, 37, 40, 39, 42];
  const workforceSparkline = [520, 580, 610, 640, 655, totalWorkforce];
  const complianceSparkline = [91, 92, 92, 93, 93, complianceScore];

  const kpis: ContractorKpiItem[] = [
    { label: "Active Contractors", value: `${activeCount}`, trend: "+4 this month", status: "Network size", tone: "info", icon: Briefcase, sparkline: activeSparkline },
    { label: "Total Contract Workforce", value: `${totalWorkforce}`, trend: "Across active projects", status: "+12% cap", tone: "warning", icon: Users, sparkline: workforceSparkline },
    { label: "Projects Supported", value: `${projectsCount} sites`, trend: "Strategic deployment", status: "Covered", tone: "success", icon: Building2, sparkline: [2, 2, 3, 3, 3, projectsCount] },
    { label: "Compliance Score", value: `${complianceScore}%`, trend: "Above audit threshold", status: "Compliant", tone: complianceScore >= 90 ? "success" : "warning", icon: ShieldCheck, sparkline: complianceSparkline },
    { label: "Average Contractor Rating", value: `${avgRating}/5`, trend: "Top performing network", status: "Excellent", tone: "success", icon: Star, sparkline: [4.4, 4.4, 4.5, 4.5, 4.6, avgRating] },
    { label: "Workforce Availability", value: `${availabilityPercent}%`, trend: "Ready to deploy", status: "Stable", tone: "info", icon: UserCheck, sparkline: [92, 94, 95, 93, 94, availabilityPercent] },
  ];

  // 2. Intelligence Insight Cards
  const insights: ContractorInsight[] = [
    {
      id: "ins-1",
      priority: "Critical",
      title: "Workforce Alert",
      description: "Riverfront Towers requires 12 additional finishing workers.",
      action: "Deploy workforce",
      type: "workforce",
      onClickAction: () => {
        setProjectFilter("project-riverfront");
        setTradeFilter("Finishing");
      },
    },
    {
      id: "ins-2",
      priority: "Warning",
      title: "Compliance Warning",
      description: `${contractorList.filter((c) => c.complianceStatus !== "Compliant").length} contractors have pending or expired documentation.`,
      action: "Review compliance",
      type: "compliance",
      onClickAction: () => setComplianceFilter("Expired Documents"),
    },
    {
      id: "ins-3",
      priority: "Success",
      title: "Performance Leader",
      description: "VoltEdge Systems achieved the highest labor productivity index this month.",
      action: "View profile",
      type: "performance",
      onClickAction: () => {
        const id = contractorList.find((c) => c.name.includes("VoltEdge"))?.id || "ctr-1002";
        window.location.href = `/people/contractors/${id}`;
      },
    },
    {
      id: "ins-4",
      priority: "Information",
      title: "Contract Expiry",
      description: "3 workforce contracts are due to expire within 30 days.",
      action: "Renew agreement",
      type: "expiry",
      onClickAction: () => setStatusFilter("Mobilizing"),
    },
  ];

  // 3. Filters Logic
  const filteredList = contractorList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(searchValue.toLowerCase()) ||
      c.trade.toLowerCase().includes(searchValue.toLowerCase());

    const matchesTrade = tradeFilter === "All" || c.trade === tradeFilter;
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesCompliance = complianceFilter === "All" || c.complianceStatus === complianceFilter;
    const matchesProject = projectFilter === "All" || c.projectId === projectFilter;

    return matchesSearch && matchesTrade && matchesStatus && matchesCompliance && matchesProject;
  });

  // Pagination logic
  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedList = filteredList.slice(startIndex, endIndex);

  // Chips for active filters
  const activeChips: string[] = [];
  if (tradeFilter !== "All") activeChips.push(`Trade: ${tradeFilter}`);
  if (statusFilter !== "All") activeChips.push(`Status: ${statusFilter}`);
  if (complianceFilter !== "All") activeChips.push(`Compliance: ${complianceFilter}`);
  if (projectFilter !== "All") {
    const projName = projectList.find((p: ProjectSummary) => p.id === projectFilter)?.name || projectFilter;
    activeChips.push(`Site: ${projName}`);
  }

  // Trigger Adding Contractor
  const handleOpenAddDrawer = () => {
    setFormValues(createEmptyContractorFormValues());
    setFormErrors({});
    setEditingContractorId(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  // Trigger Editing Contractor
  const handleOpenEditDrawer = (c: Contractor) => {
    setFormValues(buildContractorFormValues(c));
    setFormErrors({});
    setEditingContractorId(c.id);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const handleFormChange = <K extends keyof typeof formValues>(field: K, value: typeof formValues[K]) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleFormSubmit = () => {
    const errors = validateContractorForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    saveMutation.mutate();
  };

  return (
    <section className="space-y-6 pb-12">
      {/* Section 1 - Contractor Operations Hero */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-page-title font-secondary text-text-primary tracking-tight font-bold">Contractor Operations</h1>
          <p className="max-w-4xl text-body text-text-secondary">
            Manage workforce partners, contractor allocations, compliance status, workforce capacity, and project engagement across all active sites.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleOpenAddDrawer}>
            <Plus className="h-4 w-4" />
            Add Contractor
          </Button>
          <Button variant="secondary" onClick={() => downloadCsv(filteredList)}>
            <Download className="h-4 w-4" />
            Export Contractors
          </Button>
          <Button variant="secondary" onClick={handleImportClick} loading={isImporting}>
            <Upload className="h-4 w-4" />
            Import Contractors
          </Button>
          <input
            type="file"
            ref={importInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      {importMessage ? (
        <Card className="border-border-soft bg-surface-secondary">
          <CardContent className="p-4 flex items-center justify-between text-body font-semibold text-accent-primary">
            <span>{importMessage}</span>
          </CardContent>
        </Card>
      ) : null}

      {/* Section 2 - Contractor KPI Grid */}
      <ContractorKpiCards items={kpis} />

      {/* Section 3 - Contractor Intelligence */}
      <ContractorInsights items={insights} />

      {/* Section 4 - Contractor Directory */}
      <Card className="overflow-hidden border-border-soft bg-surface shadow-soft">
        <TableToolbar
          searchPlaceholder="Search contractor, contact, or trade..."
          searchValue={searchValue}
          onSearchChange={(val) => {
            setSearchValue(val);
            setCurrentPage(1);
          }}
          activeFilters={activeChips}
          onClear={handleResetFilters}
          resultLabel={`${totalItems} Partners`}
          summary={totalItems > 0 ? `Showing ${startIndex + 1}–${endIndex} of ${totalItems} contractors` : "0 records found"}
          filters={
            <div className="flex flex-wrap items-center gap-2">
              {/* Trade Select */}
              <select
                value={tradeFilter}
                onChange={(e) => {
                  setTradeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${selectClassName} !h-10 !w-auto !py-0 !text-label`}
              >
                <option value="All">All Trades</option>
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
                <option value="MEP">MEP</option>
                <option value="Landscape">Landscape</option>
                <option value="Finishing">Finishing</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${selectClassName} !h-10 !w-auto !py-0 !text-label`}
              >
                <option value="All">All Statuses</option>
                <option value="Engaged">Engaged</option>
                <option value="Mobilizing">Mobilizing</option>
                <option value="Closed">Closed</option>
              </select>

              {/* Compliance Select */}
              <select
                value={complianceFilter}
                onChange={(e) => {
                  setComplianceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${selectClassName} !h-10 !w-auto !py-0 !text-label`}
              >
                <option value="All">All Compliance</option>
                <option value="Compliant">Compliant</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Expired Documents">Expired Documents</option>
              </select>

              {/* Project Select */}
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${selectClassName} !h-10 !w-auto !py-0 !text-label`}
              >
                <option value="All">All Projects</option>
                {projectList.map((p: ProjectSummary) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          }
        />

        {/* Section 5 - Contractor Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-table text-left min-w-[1000px]">
            <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
              <tr className="h-12">
                <th className="px-4 font-semibold">Contractor</th>
                <th className="px-4 font-semibold">Trade</th>
                <th className="px-4 font-semibold">Project Site</th>
                <th className="px-4 font-semibold text-center">Workforce</th>
                <th className="px-4 font-semibold">Contact Person</th>
                <th className="px-4 font-semibold">Phone</th>
                <th className="px-4 font-semibold text-center">Compliance</th>
                <th className="px-4 font-semibold">Rating</th>
                <th className="px-4 font-semibold">Status</th>
                <th className="px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {paginatedList.length > 0 ? (
                paginatedList.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-4.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <div>
                          <p className="font-semibold text-text-primary leading-tight hover:text-accent-primary transition-colors">
                            <Link href={`/people/contractors/${c.id}`}>{c.name}</Link>
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5">Workforce Agency</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4.5 text-text-primary font-medium">{c.trade}</td>
                    <td className="px-4 py-4.5 text-text-secondary">{c.projectName || "Unknown Site"}</td>
                    <td className="px-4 py-4.5 text-center text-text-primary font-bold">{c.workforce}</td>
                    <td className="px-4 py-4.5 text-text-secondary">{c.contactPerson || "Amit Sharma"}</td>
                    <td className="px-4 py-4.5 text-text-secondary font-medium">{c.phone || "+91 98765 43210"}</td>
                    <td className="px-4 py-4.5 text-center">
                      <Badge tone={toneForCompliance(c.complianceStatus || "Compliant")}>
                        {c.complianceStatus || "Compliant"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4.5">
                      <RatingStars rating={c.rating || 4.5} />
                    </td>
                    <td className="px-4 py-4.5">
                      <Badge tone={toneForStatus(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-4.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/people/contractors/${c.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View Profile">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenEditDrawer(c)}
                          title="Edit Contractor"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {c.status !== "Closed" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-error hover:text-error"
                            loading={deactivateMutation.isPending}
                            onClick={() => deactivateMutation.mutate(c.id)}
                            title="Deactivate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <TableEmptyStateRow
                  colSpan={10}
                  title="No Contractors Found"
                  description="We couldn't find any partner matching your query. Try resetting your search or filter values."
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Section 6 - Enterprise Pagination */}
        {totalItems > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-soft px-4 py-4 bg-surface-secondary/50">
            <div className="flex items-center gap-2 text-label text-text-secondary">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`${selectClassName} !h-8 !w-auto !py-0 !px-2 !text-label`}
              >
                {rowsPerPageOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {getPageNumbers(currentPage, totalPages).map((p) => (
                <Button
                  key={p}
                  variant={currentPage === p ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setCurrentPage(p)}
                  className="h-8 w-8 p-0"
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Add/Edit Contractor Right Drawer */}
      <Drawer
        open={drawerOpen}
        title={drawerMode === "create" ? "Engage Vendor Partner" : "Edit Contractor Partner"}
        onClose={() => setDrawerOpen(false)}
        size="lg"
      >
        <ContractorForm
          mode={drawerMode}
          values={formValues}
          errors={formErrors}
          projects={projectList}
          isSubmitting={saveMutation.isPending}
          onCancel={() => setDrawerOpen(false)}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
        />
      </Drawer>
    </section>
  );
}
