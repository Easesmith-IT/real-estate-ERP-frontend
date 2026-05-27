"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Ellipsis, Pencil, RefreshCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LeadRow = {
  id: string;
  leadName: string;
  project: string;
  value: number;
  status: "New" | "Qualified" | "Negotiation" | "Won";
  owner: string;
};

const mockRows: LeadRow[] = [
  { id: "LD-1021", leadName: "Priya Sharma", project: "Skyline Towers", value: 12800000, status: "Qualified", owner: "Aman" },
  { id: "LD-1022", leadName: "Raghav Verma", project: "Palm Residency", value: 8600000, status: "Negotiation", owner: "Sneha" },
  { id: "LD-1023", leadName: "Anita Iyer", project: "Lake View Villas", value: 21100000, status: "New", owner: "Ritesh" },
  { id: "LD-1024", leadName: "Mohit Jain", project: "City One Heights", value: 9800000, status: "Won", owner: "Aman" },
  { id: "LD-1025", leadName: "Farah Khan", project: "Riviera Square", value: 14200000, status: "Qualified", owner: "Sneha" },
  { id: "LD-1026", leadName: "Arjun Nair", project: "Vista Grande", value: 17600000, status: "Negotiation", owner: "Ritesh" },
];

function TableSkeletonRows({ compact }: { compact: boolean }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <tr key={`sk-${index}`} className={`${compact ? "h-10" : "h-12"} border-t border-border-soft`}>
          <td className="px-4"><div className="h-4 w-4 rounded bg-hover" /></td>
          <td className="px-4"><div className="h-4 w-36 rounded bg-hover" /></td>
          <td className="px-4"><div className="h-4 w-40 rounded bg-hover" /></td>
          <td className="px-4"><div className="h-4 w-24 rounded bg-hover" /></td>
          <td className="px-4"><div className="h-5 w-20 rounded-full bg-hover" /></td>
          <td className="px-4"><div className="h-4 w-20 rounded bg-hover" /></td>
          <td className="px-4"><div className="h-8 w-16 rounded bg-hover" /></td>
        </tr>
      ))}
    </>
  );
}

export function EnterpriseTable() {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const [tableScrolled, setTableScrolled] = useState(false);
  const [search, setSearchRaw] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRows, setDraftRows] = useState(mockRows);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  // Reset to page 1 whenever the search filter changes
  const setSearch = (value: string) => {
    setSearchRaw(value);
    setPage(1);
  };

  const filtered = useMemo(
    () =>
      draftRows.filter((row) => {
        const query = search.toLowerCase();
        return row.leadName.toLowerCase().includes(query) || row.project.toLowerCase().includes(query) || row.id.toLowerCase().includes(query);
      }),
    [search, draftRows],
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    const node = tableScrollRef.current;
    if (!node) return;

    const onScroll = () => setTableScrolled(node.scrollTop > 2);
    onScroll();
    node.addEventListener("scroll", onScroll, { passive: true });

    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? paginated.map((row) => row.id) : []);
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((current) => (checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)));
  };

  const updateOwner = (id: string, owner: string) => {
    setDraftRows((rows) => rows.map((row) => (row.id === id ? { ...row, owner } : row)));
  };

  const exportCsv = () => {
    const headers = ["ID", "Lead", "Project", "Value", "Status", "Owner"];
    const rows = filtered.map((row) => [row.id, row.leadName, row.project, row.value.toString(), row.status, row.owner]);
    const csv = [headers.join(","), ...rows.map((item) => item.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lead-pipeline.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const refreshRows = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setDraftRows(mockRows);
    setEditingId(null);
    setSelected([]);
    setPage(1);
    setLoading(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>Lead Pipeline Table</CardTitle>
            <Badge tone="info">Sticky header</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refreshRows} title="Refresh table">
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <div ref={tableScrollRef} className="max-h-[520px] overflow-auto">
          <div
            className={cn(
              "sticky-layer sticky top-0 z-[var(--z-sticky-local)] flex min-h-[var(--table-filter-h)] items-center border-y border-border-soft bg-surface-secondary px-6 py-3 backdrop-blur",
              tableScrolled ? "shadow-[0_1px_0_rgba(15,23,42,0.08)]" : "",
            )}
          >
            <div className="flex w-full flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by lead, project, id"
                className="h-10 min-w-[220px] max-w-[360px] bg-surface-secondary"
              />
              <Button variant="secondary" size="sm" onClick={() => setCompact((value) => !value)}>
                {compact ? "Standard density" : "Compact density"}
              </Button>
            </div>
          </div>
          <table className="w-full table-fixed border-separate border-spacing-0 text-table">
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>
            <thead
              className={cn(
                "sticky-layer sticky top-[var(--table-filter-h)] z-[var(--z-sticky-table-head)] bg-surface-secondary",
                tableScrolled ? "shadow-[0_1px_0_rgba(15,23,42,0.08)]" : "shadow-[0_1px_0_rgba(15,23,42,0.05)]",
              )}
            >
              <tr className="h-[var(--table-head-h)] border-b border-border-soft text-left text-text-secondary">
                <th className="px-4">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={paginated.length > 0 && paginated.every((row) => selected.includes(row.id))}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </th>
                <th className="px-4">Lead</th>
                <th className="px-4">Project</th>
                <th className="px-4">Value</th>
                <th className="px-4">Status</th>
                <th className="px-4">Owner</th>
                <th className="px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows compact={compact} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-body text-text-muted">
                    No leads found for current filters.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={row.id}
                    className={`${compact ? "h-10" : "h-12"} border-t border-border-soft bg-surface text-text-secondary subtle-hover hover:bg-hover`}
                  >
                    <td className="px-4">
                      <input type="checkbox" checked={selected.includes(row.id)} onChange={(event) => toggleRow(row.id, event.target.checked)} />
                    </td>
                    <td className="max-w-0 px-4 truncate text-text-primary" title={row.leadName}>{row.leadName}</td>
                    <td className="max-w-0 px-4 truncate" title={row.project}>{row.project}</td>
                    <td className="px-4 text-text-primary">INR {row.value.toLocaleString("en-IN")}</td>
                    <td className="px-4">
                      <Badge
                        tone={
                          row.status === "Won"
                            ? "success"
                            : row.status === "Negotiation"
                              ? "warning"
                              : row.status === "Qualified"
                                ? "info"
                                : "neutral"
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4">
                      {editingId === row.id ? (
                        <Input className="h-9 bg-surface-secondary" value={row.owner} onChange={(event) => updateOwner(row.id, event.target.value)} />
                      ) : (
                        row.owner
                      )}
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(editingId === row.id ? null : row.id)} title="Edit owner">
                          {editingId === row.id ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" title="Row actions">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <div className="flex items-center justify-between border-t border-border-soft px-6 py-4 text-body text-text-secondary">
        <p>{selected.length} selected</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
