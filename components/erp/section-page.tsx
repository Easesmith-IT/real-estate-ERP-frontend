import { getSectionBySlug } from "@/lib/navigation";
import { NavPage, NavSection } from "@/types/navigation";
import {
  ActivityTimeline,
  AnalyticsCards,
  EmptyState,
  KanbanLayout,
  KpiGrid,
  PermissionsMatrix,
  QuickActionPanel,
  SectionHeader,
  SectionOverview,
  SectionStats,
  SettingsPanel,
  TableLayout,
  TabsRow,
} from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function HomeDashboardContent() {
  return (
    <div className="space-y-6">
      <KpiGrid
        items={[
          { label: "Active Projects", value: "18", trend: "+2 this week", tone: "success" },
          { label: "Workforce Today", value: "624", trend: "95% attendance", tone: "info" },
          { label: "Delayed Tasks", value: "21", trend: "+3 critical", tone: "warning" },
          { label: "Material Alerts", value: "12", trend: "4 low stock", tone: "warning" },
          { label: "New Leads", value: "47", trend: "+11 today", tone: "success" },
          { label: "Pending Approvals", value: "29", trend: "Needs review", tone: "warning" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AnalyticsCards
            title="Project and Sales Trends"
            cards={[
              { title: "Execution Velocity", description: "Placeholder for schedule vs actual progress trend chart." },
              { title: "Lead Conversions", description: "Placeholder for lead-to-customer conversion trend chart." },
              { title: "Workforce Efficiency", description: "Placeholder for productivity movement by project cluster." },
            ]}
          />
        </div>
        <div className="xl:col-span-1">
          <ActivityTimeline title="Recent Activity" />
        </div>
      </div>
      <QuickActionPanel
        pages={[
          { label: "Create Project", slug: "create-project", description: "Start a new construction project.", template: "overview" },
          { label: "Approve Request", slug: "approve-request", description: "Review pending purchase approvals.", template: "overview" },
          { label: "Add Lead", slug: "add-lead", description: "Capture new sales lead from inquiry.", template: "overview" },
          { label: "Record Attendance", slug: "record-attendance", description: "Submit today workforce attendance.", template: "overview" },
          { label: "Stock Transfer", slug: "stock-transfer", description: "Move materials between warehouses.", template: "overview" },
          { label: "Generate Report", slug: "generate-report", description: "Export operational summary report.", template: "overview" },
        ]}
      />
    </div>
  );
}

function renderTemplate(section: NavSection, page: NavPage): React.ReactNode {
  switch (page.template) {
    case "dashboard":
      if (section.slug === "home" && page.slug === "dashboard") return <HomeDashboardContent />;
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "Active Items", value: "126", trend: "+9 in last 24h", tone: "success" },
              { label: "In Review", value: "38", trend: "Requires approvals", tone: "warning" },
              { label: "Throughput", value: "87%", trend: "+2.3% week-over-week", tone: "info" },
            ]}
          />
          <AnalyticsCards
            cards={[
              { title: "Performance Snapshot", description: "Placeholder for key performance trend visualization." },
              { title: "Cycle Time", description: "Placeholder for process cycle time and bottleneck chart." },
              { title: "Capacity Allocation", description: "Placeholder for utilization mix and allocation trend." },
            ]}
          />
          <ActivityTimeline title="Recent Activity" />
        </div>
      );

    case "activity":
      return (
        <div className="space-y-6">
          <TabsRow tabs={["All", "Approvals", "Projects", "People", "Materials"]} />
          <ActivityTimeline title={`${page.label} Timeline`} />
          <AnalyticsCards
            title="Activity Signals"
            cards={[
              { title: "Escalations", description: "Placeholder for escalated events trend." },
              { title: "Response Times", description: "Placeholder for average response SLA trend." },
              { title: "Resolved Actions", description: "Placeholder for closure trajectory chart." },
            ]}
          />
        </div>
      );

    case "quick-actions":
      return (
        <div className="space-y-6">
          <QuickActionPanel pages={section.pages} />
          <EmptyState
            title="Action Templates"
            description="Saved action templates and role-specific macros will appear here after backend workflows are connected."
            actionLabel="Create Action Template"
          />
        </div>
      );

    case "directory":
      return (
        <div className="space-y-6">
          <TabsRow tabs={["Overview", "Directory", "Profiles", "Insights"]} />
          <TableLayout
            title={`${page.label} Table`}
            rowPrefix={section.slug.slice(0, 3).toUpperCase()}
            columns={["ID", "Name", "Category", "Owner", "Updated"]}
          />
          <Card>
            <CardHeader>
              <CardTitle>{page.label} Profile Structure</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="surface-secondary p-4">
                <p className="text-card-title text-text-primary">Primary Information</p>
                <p className="mt-2 text-body text-text-secondary">Core profile panel placeholder with contact, role, and assignment context.</p>
              </div>
              <div className="surface-secondary p-4">
                <p className="text-card-title text-text-primary">Activity Summary</p>
                <p className="mt-2 text-body text-text-secondary">Recent interactions, tasks, and pending actions section placeholder.</p>
              </div>
              <div className="surface-secondary p-4">
                <p className="text-card-title text-text-primary">Performance Signals</p>
                <p className="mt-2 text-body text-text-secondary">Utilization, contribution, and quality indicators placeholder.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case "attendance":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "Present", value: "594", trend: "95.1% attendance", tone: "success" },
              { label: "Late Check-ins", value: "36", trend: "-4 today", tone: "warning" },
              { label: "Sites Reporting", value: "22", trend: "100% site sync", tone: "info" },
            ]}
          />
          <TableLayout title="Attendance Log" rowPrefix="ATT" columns={["Record", "Employee", "Site", "Shift", "Check-In"]} />
          <AnalyticsCards
            cards={[
              { title: "Attendance Trend", description: "Placeholder for attendance by date range." },
              { title: "Shift Utilization", description: "Placeholder for shift-level manpower usage." },
              { title: "Absentee Patterns", description: "Placeholder for absenteeism trend analytics." },
            ]}
          />
        </div>
      );

    case "analytics":
      return (
        <div className="space-y-6">
          <TabsRow tabs={["Summary", "Trends", "Comparisons", "Forecast"]} />
          <AnalyticsCards
            title={`${page.label} Dashboard`}
            cards={[
              { title: "Trend Overview", description: "Placeholder for period-over-period trends." },
              { title: "Segment Breakdown", description: "Placeholder for segment-wise performance mix." },
              { title: "Risk Signals", description: "Placeholder for anomaly and risk chart slots." },
              { title: "Forecast Lane", description: "Placeholder for projected outcome visualizations." },
              { title: "Variance View", description: "Placeholder for target vs actual variance chart." },
              { title: "Efficiency Index", description: "Placeholder for process efficiency index chart." },
            ]}
          />
          <EmptyState
            title="Advanced Analytics Integrations"
            description="Connect data pipelines to activate live charting, trend forecasting, and deep drilldowns."
            actionLabel="Connect Data Source"
          />
        </div>
      );

    case "kanban":
      return (
        <div className="space-y-6">
          <KanbanLayout
            title="Sales Pipeline"
            stages={["New", "Contacted", "Interested", "Visit Scheduled", "Negotiation", "Closed"]}
          />
          <AnalyticsCards
            cards={[
              { title: "Stage Conversion", description: "Placeholder for stage-wise conversion percentages." },
              { title: "Pipeline Aging", description: "Placeholder for aging analysis by stage." },
              { title: "Win-Loss Trend", description: "Placeholder for closure and drop-off trend chart." },
            ]}
          />
        </div>
      );

    case "task-board":
      return (
        <div className="space-y-6">
          <KanbanLayout
            title="Project Task Board"
            stages={["Planned", "Ready", "In Progress", "Review", "Blocked", "Done"]}
          />
          <TableLayout title="Task Allocation" rowPrefix="TSK" columns={["Task", "Project", "Owner", "Due Date", "Priority"]} />
        </div>
      );

    case "milestones":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "Milestones Planned", value: "132", trend: "Q2 Program", tone: "info" },
              { label: "Completed", value: "104", trend: "78.7% completion", tone: "success" },
              { label: "At Risk", value: "11", trend: "Needs intervention", tone: "warning" },
            ]}
          />
          <Card>
            <CardHeader>
              <CardTitle>Milestone Progress Cards</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {["Tower A", "Tower B", "Club House", "Road Works", "Landscaping", "Utilities"].map((name, index) => (
                <div key={name} className="surface-secondary space-y-3 p-4">
                  <p className="text-card-title text-text-primary">{name}</p>
                  <p className="text-body text-text-secondary">Milestone set {index + 1} progress overview placeholder.</p>
                  <div className="h-2 w-full rounded-full bg-hover">
                    <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${52 + index * 7}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      );

    case "daily-report":
      return (
        <div className="space-y-6">
          <TabsRow tabs={["Today", "Yesterday", "This Week", "By Project"]} />
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress Report Layout</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="surface-secondary p-4">
                <p className="text-card-title text-text-primary">Site Summary</p>
                <p className="mt-2 text-body text-text-secondary">Placeholder for executed tasks, constraints, and planned next shift.</p>
              </div>
              <div className="surface-secondary p-4">
                <p className="text-card-title text-text-primary">Resource Utilization</p>
                <p className="mt-2 text-body text-text-secondary">Placeholder for workforce, machinery, and material usage by site.</p>
              </div>
              <div className="surface-secondary p-4 lg:col-span-2">
                <p className="text-card-title text-text-primary">Issues and Blockers</p>
                <p className="mt-2 text-body text-text-secondary">Placeholder for critical blockers, delays, and escalation notes with tags.</p>
              </div>
            </CardContent>
          </Card>
          <TableLayout title="DPR Records" rowPrefix="DPR" columns={["Report", "Project", "Submitted By", "Shift", "Date"]} />
        </div>
      );

    case "resources":
      return (
        <div className="space-y-6">
          <TableLayout title={`${page.label} Allocation`} rowPrefix="RES" columns={["Code", "Resource", "Type", "Assigned To", "Utilization"]} />
          <Card>
            <CardHeader>
              <CardTitle>{section.slug === "materials" ? "Warehouse Cards" : "Allocation Summary Cards"}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {["Central", "North", "South", "East", "West", "Transit"].map((location) => (
                <div key={location} className="surface-secondary p-4">
                  <p className="text-card-title text-text-primary">{location} Hub</p>
                  <p className="mt-2 text-body text-text-secondary">Capacity and allocation placeholder details for operational planning.</p>
                  <Badge tone="info" className="mt-3">Operational</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      );

    case "documents":
      return (
        <div className="space-y-6">
          <TableLayout title="Document Register" rowPrefix="DOC" columns={["Doc ID", "Title", "Category", "Owner", "Version"]} />
          <EmptyState
            title="Document Automation"
            description="Automated document lifecycle, approvals, and sharing controls can be connected in later backend phases."
            actionLabel="Upload Document"
          />
        </div>
      );

    case "inventory":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "SKUs Tracked", value: "1,248", trend: "Across all warehouses", tone: "info" },
              { label: "Low Stock Items", value: "37", trend: "Requires reorder", tone: "warning" },
              { label: "Inventory Accuracy", value: "97.4%", trend: "+0.6% this month", tone: "success" },
            ]}
          />
          <TableLayout title={`${page.label} Inventory`} rowPrefix="MAT" columns={["SKU", "Material", "Warehouse", "On Hand", "Reorder Level"]} />
          <AnalyticsCards
            cards={[
              { title: "Consumption Trend", description: "Placeholder for material usage trend by project." },
              { title: "Procurement Lead Time", description: "Placeholder for replenishment cycle analytics." },
              { title: "Category Mix", description: "Placeholder for category-wise stock value distribution." },
            ]}
          />
        </div>
      );

    case "movement":
      return (
        <div className="space-y-6">
          <TabsRow tabs={["All Movements", "Pending", "Approved", "Completed"]} />
          <TableLayout title={`${page.label} Register`} rowPrefix="MOV" columns={["Txn", "Material", "From", "To", "Quantity"]} />
          <EmptyState
            title="Movement Workflow Automation"
            description="Approval automation and stock reconciliation rules will be activated when transaction backend APIs are connected."
            actionLabel="Create Movement"
          />
        </div>
      );

    case "alerts":
      return (
        <div className="space-y-6">
          <TabsRow tabs={["All", "Critical", "High", "Medium", "Low"]} />
          <ActivityTimeline title={`${page.label} Timeline`} />
          <TableLayout title="Alert Queue" rowPrefix="ALT" columns={["Alert ID", "Category", "Source", "Owner", "Raised At"]} />
        </div>
      );

    case "comparison":
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Comparison Layout</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="w-full min-w-[900px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Criteria</th>
                    <th className="px-4 text-left">Vendor A</th>
                    <th className="px-4 text-left">Vendor B</th>
                    <th className="px-4 text-left">Vendor C</th>
                  </tr>
                </thead>
                <tbody>
                  {["Price", "Delivery Time", "Quality Score", "Credit Terms", "Warranty"].map((criterion) => (
                    <tr key={criterion} className="h-12 border-t border-border-soft">
                      <td className="px-4 text-text-primary">{criterion}</td>
                      <td className="px-4">Placeholder</td>
                      <td className="px-4">Placeholder</td>
                      <td className="px-4">Placeholder</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <TableLayout title="Quotation Register" rowPrefix="QTN" columns={["Quote", "Vendor", "Request", "Amount", "Submitted"]} />
        </div>
      );

    case "approvals":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "Pending Approvals", value: "29", trend: "Across all workflows", tone: "warning" },
              { label: "Approved Today", value: "17", trend: "+5 vs yesterday", tone: "success" },
              { label: "SLA Breaches", value: "3", trend: "Needs escalation", tone: "warning" },
            ]}
          />
          <TableLayout title="Approval Workflow Queue" rowPrefix="APR" columns={["Request", "Type", "Requested By", "Stage", "Submitted"]} />
        </div>
      );

    case "reports":
      return (
        <div className="space-y-6">
          <TabsRow tabs={["Summary", "Detailed", "Comparative", "Exports"]} />
          <Card>
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {["Date Range", "Project", "Department", "Status"].map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-label text-text-secondary">{field}</label>
                  <input
                    className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-primary"
                    defaultValue={field === "Date Range" ? "This Month" : ""}
                    placeholder={`Select ${field.toLowerCase()}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <AnalyticsCards
            title="Report Dashboard"
            cards={[
              { title: "Trend Area", description: "Placeholder for time-series visualization." },
              { title: "Comparison View", description: "Placeholder for comparative chart blocks." },
              { title: "Distribution Mix", description: "Placeholder for pie/bar composition charts." },
            ]}
          />
          <TableLayout title="Export Center" rowPrefix="RPT" columns={["Report", "Generated By", "Type", "Range", "Generated At"]} />
        </div>
      );

    case "executive":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "Enterprise Revenue Run-Rate", value: "INR 78.4 Cr", trend: "+12.6% QoQ", tone: "success" },
              { label: "Portfolio Schedule Health", value: "89%", trend: "2 projects at risk", tone: "warning" },
              { label: "Operating Efficiency", value: "84.2%", trend: "+1.4% this month", tone: "info" },
            ]}
          />
          <AnalyticsCards
            title="Executive Trend Visualizations"
            cards={[
              { title: "Strategic KPI Trend", description: "Premium placeholder for multi-quarter performance lines." },
              { title: "Capital Utilization", description: "Placeholder for budget-to-actual and utilization trend view." },
              { title: "Risk Heatmap", description: "Placeholder for portfolio risk concentration heatmap." },
            ]}
          />
          <Card className="surface-secondary">
            <CardContent className="py-6">
              <p className="text-card-title text-text-primary">Executive Notes Panel</p>
              <p className="mt-2 text-body text-text-secondary">
                Curated strategic insights, watchlist highlights, and premium management commentary placeholders.
              </p>
            </CardContent>
          </Card>
        </div>
      );

    case "health":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "Healthy Projects", value: "14", trend: "Green status", tone: "success" },
              { label: "Watchlist", value: "3", trend: "Needs intervention", tone: "warning" },
              { label: "Critical", value: "1", trend: "Executive attention", tone: "warning" },
            ]}
          />
          <TableLayout title="Project Health Indicators" rowPrefix="PHI" columns={["Project", "Stage", "Schedule", "Cost", "Risk"]} />
        </div>
      );

    case "financial":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "Revenue", value: "INR 52.3 Cr", trend: "+8.1% MTD", tone: "success" },
              { label: "Cost", value: "INR 37.9 Cr", trend: "+4.2% MTD", tone: "warning" },
              { label: "Margin", value: "27.5%", trend: "+1.3%", tone: "info" },
            ]}
          />
          <AnalyticsCards
            cards={[
              { title: "Revenue vs Cost", description: "Placeholder for monthly income and expenditure trend." },
              { title: "Cash Flow", description: "Placeholder for inflow and outflow movement." },
              { title: "Collection Performance", description: "Placeholder for receivables collection trend." },
            ]}
          />
        </div>
      );

    case "operational":
      return (
        <div className="space-y-6">
          <KpiGrid
            items={[
              { label: "On-Time Deliveries", value: "92%", trend: "Across projects", tone: "success" },
              { label: "Open Blockers", value: "16", trend: "Prioritize this week", tone: "warning" },
              { label: "Utilization", value: "81%", trend: "Balanced load", tone: "info" },
            ]}
          />
          <AnalyticsCards
            cards={[
              { title: "Site Productivity", description: "Placeholder for site-level throughput metrics." },
              { title: "Resource Availability", description: "Placeholder for availability and bottleneck insights." },
              { title: "Operational SLA", description: "Placeholder for SLA attainment and drift indicators." },
            ]}
          />
        </div>
      );

    case "insights":
      return (
        <div className="space-y-6">
          <AnalyticsCards
            title="Business Insights"
            cards={[
              { title: "Growth Opportunities", description: "Placeholder cards for emerging opportunity signals." },
              { title: "Risk Exposure", description: "Placeholder cards for risk cluster trends." },
              { title: "Operational Leverage", description: "Placeholder cards for efficiency opportunities." },
              { title: "Market Movement", description: "Placeholder cards for market trend proxies." },
              { title: "Investment Signals", description: "Placeholder cards for high-priority investment options." },
              { title: "Execution Readiness", description: "Placeholder cards for readiness and capability indicators." },
            ]}
          />
          <EmptyState
            title="Decision Intelligence"
            description="AI-generated executive insight narratives and scenario simulations can be connected in later iterations."
            actionLabel="Configure Insight Rules"
          />
        </div>
      );

    case "settings":
      return (
        <div className="space-y-6">
          <SettingsPanel title={page.label} fields={["Name", "Code", "Default Value", "Status"]} />
          <SettingsPanel title="Configuration Panels" fields={["Policy", "Threshold", "Escalation", "Review Cycle"]} />
        </div>
      );

    case "permissions":
      return (
        <div className="space-y-6">
          <SettingsPanel title="Role Management" fields={["Role Name", "Description", "Default Access", "Approval Required"]} />
          <PermissionsMatrix />
        </div>
      );

    default:
      return (
        <EmptyState
          title="Page scaffold ready"
          description="Page architecture has been provisioned. Connect backend data and interactions in the next implementation phase."
        />
      );
  }
}

export function SectionOverviewPage({ section }: { section: NavSection }) {
  return (
    <section className="space-y-6">
      <SectionHeader title={section.label} description={section.description} />
      <SectionStats section={section} />
      <SectionOverview section={section} />
    </section>
  );
}

export function SectionDetailPage({ section, page }: { section: NavSection; page: NavPage }) {
  return (
    <section className="space-y-6">
      <SectionHeader title={page.label} description={page.description} />
      {renderTemplate(section, page)}
    </section>
  );
}

export function resolveSectionOrNull(sectionSlug: string): NavSection | null {
  return getSectionBySlug(sectionSlug) ?? null;
}
