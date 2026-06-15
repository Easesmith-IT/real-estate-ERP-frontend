import { ArrowRight, Download, Filter, Plus, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { getPageHref, getSectionDefaultHref } from "@/lib/navigation";
import { NavPage, NavSection } from "@/types/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-page-title font-secondary text-text-primary">{title}</h1>
        <p className="max-w-3xl text-body text-text-secondary">{description}</p>
      </div>
      {actions}
    </div>
  );
}

export function KpiGrid({
  items,
}: {
  items: Array<{ label: string; value: string; trend?: string; tone?: "success" | "warning" | "info" | "neutral" }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="card-kpi">
          <CardHeader className="border-none pb-2">
            <CardTitle className="text-kpi-label text-text-kpi-label">{item.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-kpi-value text-text-primary">{item.value}</p>
            {item.trend ? (
              <Badge tone={item.tone ?? "info"} className="text-kpi-trend">
                {item.trend}
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AnalyticsCards({
  title = "Analytics Overview",
  cards,
}: {
  title?: string;
  cards: Array<{ title: string; description: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <div key={card.title} className="surface-secondary space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-card-title text-text-primary">{card.title}</p>
              <Badge tone="info">Placeholder</Badge>
            </div>
            <p className="text-body text-text-secondary">{card.description}</p>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-hover">
                <div
                  className="h-2 rounded-full bg-accent-primary"
                  style={{ width: `${56 + (index % 3) * 14}%` }}
                />
              </div>
              <div className="h-2 w-full rounded-full bg-hover">
                <div
                  className="h-2 rounded-full bg-accent-secondary"
                  style={{ width: `${42 + (index % 3) * 12}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FilterToolbar({
  placeholder,
  rightSlot,
}: {
  placeholder: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="sticky-layer sticky top-0 z-[var(--z-sticky-local)] flex flex-wrap items-center justify-between gap-3 border-y border-border-soft bg-surface-secondary px-4 py-3">
      <div className="flex min-w-[260px] flex-1 items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
          <Input placeholder={placeholder} className="h-11 bg-surface-secondary pl-9" />
        </div>
        <Button variant="secondary" size="sm">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
      {rightSlot}
    </div>
  );
}

export function TableToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  actions,
  resultLabel,
  summary,
  activeFilters = [],
  onClear,
}: {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  resultLabel: string;
  summary?: string;
  activeFilters?: string[];
  onClear?: () => void;
}) {
  const showClear = Boolean(onClear) && (searchValue.trim().length > 0 || activeFilters.length > 0);

  return (
    <div className="border-b border-border-soft bg-surface-secondary/80">
      <div className="space-y-4 px-4 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1 xl:max-w-[640px]">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 rounded-[var(--radius-input)] border-white/70 bg-white pl-10 shadow-soft"
            />
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2 xl:justify-end">{actions}</div> : null}
        </div>
        {filters ? (
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-3 rounded-[24px] border border-border-soft/80 bg-white/90 p-2 shadow-soft">
              {filters}
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{resultLabel}</Badge>
          {activeFilters.map((filter) => (
            <Badge key={filter} tone="info">
              {filter}
            </Badge>
          ))}
          {showClear ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          ) : null}
        </div>
        {summary ? <p className="text-label text-text-muted">{summary}</p> : null}
      </div>
    </div>
  );
}

export function TableEmptyStateRow({
  colSpan,
  title,
  description,
}: {
  colSpan: number;
  title: string;
  description: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10">
        <div className="rounded-[var(--radius-card)] border border-dashed border-border-soft bg-surface-secondary px-5 py-8 text-center">
          <p className="text-card-title text-text-primary">{title}</p>
          <p className="mt-2 text-body text-text-secondary">{description}</p>
        </div>
      </td>
    </tr>
  );
}

export function TableLayout({
  title,
  columns,
  rowPrefix,
  showStatus = true,
}: {
  title: string;
  columns: string[];
  rowPrefix: string;
  showStatus?: boolean;
}) {
  const rows = Array.from({ length: 6 });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <div className="max-h-[520px] overflow-auto">
          <FilterToolbar
            placeholder={`Search ${title.toLowerCase()}`}
            rightSlot={
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            }
          />
          <table className="w-full border-separate border-spacing-0 text-table">
            <thead className="sticky-layer sticky top-[65px] z-[var(--z-sticky-table-head)] bg-surface-secondary">
              <tr className="h-[var(--table-head-h)] border-b border-border-soft text-left text-text-secondary">
                {columns.map((column) => (
                  <th key={column} className="px-4 font-medium">
                    {column}
                  </th>
                ))}
                {showStatus ? <th className="px-4 font-medium">Status</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((_, index) => (
                <tr key={`row-${index}`} className="h-12 border-t border-border-soft bg-surface text-text-secondary hover:bg-hover">
                  {columns.map((column) => (
                    <td key={`${column}-${index}`} className="px-4">
                      {column === columns[0] ? `${rowPrefix}-${100 + index}` : `${column} Placeholder`}
                    </td>
                  ))}
                  {showStatus ? (
                    <td className="px-4">
                      <Badge tone={index % 3 === 0 ? "warning" : index % 2 === 0 ? "info" : "success"}>
                        {index % 3 === 0 ? "Pending" : index % 2 === 0 ? "In Progress" : "Completed"}
                      </Badge>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanLayout({
  title,
  stages,
}: {
  title: string;
  stages: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <div className="grid min-w-[1100px] grid-cols-6 gap-4">
          {stages.map((stage, stageIndex) => (
            <div key={stage} className="surface-secondary flex min-h-[320px] flex-col gap-3 p-3">
              <div className="flex items-center justify-between">
                <p className="text-card-title text-text-primary">{stage}</p>
                <Badge tone={stageIndex > 3 ? "warning" : "info"}>{2 + (stageIndex % 4)}</Badge>
              </div>
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <div key={`${stage}-${cardIndex}`} className="rounded-[var(--radius-input)] border border-border-soft bg-surface p-3 shadow-soft">
                  <p className="text-body font-medium text-text-primary">Lead {stageIndex + 1}{cardIndex + 1}</p>
                  <p className="mt-1 text-label text-text-muted">Follow-up: Tomorrow, 10:30 AM</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone="neutral">Sales</Badge>
                    <Badge tone="info">Priority</Badge>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityTimeline({ title }: { title: string }) {
  const items = [
    "Approval request raised for excavation budget revision.",
    "Concrete batch allocation adjusted for Tower B foundation.",
    "Workforce shift rescheduled due to weather advisory.",
    "Material transfer request initiated for central warehouse.",
    "New lead assigned to senior sales coordinator.",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-primary" />
            <div className="space-y-1">
              <p className="text-body text-text-primary">{item}</p>
              <p className="text-label text-text-muted">{index + 1}h ago</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel = "Create Item",
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <Card className="surface-secondary border-dashed">
      <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-section-title font-secondary text-text-primary">{title}</p>
        <p className="max-w-xl text-body text-text-secondary">{description}</p>
        <Button variant="secondary">{actionLabel}</Button>
      </CardContent>
    </Card>
  );
}

export function TabsRow({ tabs }: { tabs: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab, index) => (
        <button
          type="button"
          key={tab}
          className={`rounded-[var(--radius-button)] border px-4 py-2 text-body subtle-hover ${
            index === 0
              ? "border-accent-primary bg-active-soft text-accent-primary"
              : "border-border-soft bg-surface text-text-secondary hover:bg-hover"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel({
  title,
  fields,
}: {
  title: string;
  fields: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field} className="space-y-1.5">
            <label className="text-label text-text-secondary">{field}</label>
            <Input placeholder={`${field} value`} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PermissionsMatrix() {
  const roles = ["Admin", "Manager", "Accountant", "Sales"];
  const modules = ["Projects", "People", "Sales", "Materials", "Approvals", "Reports"];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Permissions Matrix</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-table">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr className="h-12 border-b border-border-soft">
                <th className="px-4 text-left">Module</th>
                {roles.map((role) => (
                  <th key={role} className="px-4 text-left">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((moduleName, rowIndex) => (
                <tr key={moduleName} className="h-12 border-t border-border-soft">
                  <td className="px-4 text-text-primary">{moduleName}</td>
                  {roles.map((role, roleIndex) => (
                    <td key={`${moduleName}-${role}`} className="px-4">
                      <Badge tone={(rowIndex + roleIndex) % 3 === 0 ? "warning" : "success"}>
                        {(rowIndex + roleIndex) % 3 === 0 ? "Limited" : "Full"}
                      </Badge>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionOverview({ section }: { section: NavSection }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {section.pages.map((page) => (
        <Link key={page.slug} href={getPageHref(section.slug, page.slug)} className="block">
          <Card className="subtle-hover h-full hover:-translate-y-0.5 hover:border-accent-primary/30">
            <CardHeader>
              <CardTitle>{page.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-body text-text-secondary">{page.description}</p>
              <span className="inline-flex items-center gap-1 text-body text-accent-primary">
                Open Page <ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
      <Card className="surface-secondary border-dashed lg:col-span-2">
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-card-title text-text-primary">Start with section dashboard</p>
            <p className="text-body text-text-secondary">Jump to the primary workspace for this section.</p>
          </div>
          <Link href={getSectionDefaultHref(section)}>
            <Button>Open Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function SectionStats({ section }: { section: NavSection }) {
  return (
    <KpiGrid
      items={[
        { label: `${section.label} Workstreams`, value: `${section.pages.length}`, trend: "Structured modules", tone: "info" },
        { label: "Pending Actions", value: "24", trend: "+6 since yesterday", tone: "warning" },
        { label: "Completion Health", value: "82%", trend: "+4.2% this week", tone: "success" },
      ]}
    />
  );
}

export function QuickActionPanel({ pages }: { pages: NavPage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pages.slice(0, 6).map((page) => (
          <button
            type="button"
            key={page.slug}
            className="subtle-hover rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-4 py-3 text-left hover:bg-hover"
          >
            <p className="text-body font-medium text-text-primary">{page.label}</p>
            <p className="mt-1 text-label text-text-muted">{page.description}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
