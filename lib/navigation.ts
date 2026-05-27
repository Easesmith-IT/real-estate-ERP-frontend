import { NavPage, NavSection, UserRole } from "@/types/navigation";

const allRoles: UserRole[] = ["admin", "manager", "accountant", "sales"];

export const roleLabelMap = {
  admin: "Admin",
  manager: "Manager",
  accountant: "Accountant",
  sales: "Sales",
} as const;

export const defaultRoute = "/home/dashboard";

export const navSections: NavSection[] = [
  {
    label: "Home",
    slug: "home",
    icon: "House",
    description: "Operations command center, activity stream, and daily quick actions.",
    roles: allRoles,
    pages: [
      {
        label: "Dashboard",
        slug: "dashboard",
        description: "KPI overview with active projects, workforce, alerts, leads, and approvals.",
        template: "dashboard",
      },
      {
        label: "Activity Feed",
        slug: "activity-feed",
        description: "Chronological operational updates across projects, teams, and approvals.",
        template: "activity",
      },
      {
        label: "Quick Actions",
        slug: "quick-actions",
        description: "Fast execution panel for recurring operations and approvals.",
        template: "quick-actions",
      },
    ],
  },
  {
    label: "People",
    slug: "people",
    icon: "Users",
    description: "Workforce structure, attendance, payroll, teams, and insights.",
    roles: allRoles,
    pages: [
      {
        label: "Employees",
        slug: "employees",
        description: "Employee directory with advanced filters and searchable workforce records.",
        template: "directory",
      },
      {
        label: "Contractors",
        slug: "contractors",
        description: "Contractor registry, compliance status, and engagement details.",
        template: "directory",
      },
      {
        label: "Attendance",
        slug: "attendance",
        description: "Daily attendance dashboard and workforce availability snapshots.",
        template: "attendance",
      },
      {
        label: "Payroll",
        slug: "payroll",
        description: "Payroll processing structure and payout visibility by teams.",
        template: "directory",
      },
      {
        label: "Teams",
        slug: "teams",
        description: "Team composition, role distribution, and supervisors hierarchy.",
        template: "directory",
      },
      {
        label: "Workforce Insights",
        slug: "workforce-insights",
        description: "Workforce analytics placeholders with performance and utilization trends.",
        template: "analytics",
      },
    ],
  },
  {
    label: "Sales",
    slug: "sales",
    icon: "Handshake",
    description: "Leads, pipeline progression, customer journeys, and follow-ups.",
    roles: allRoles,
    pages: [
      {
        label: "Leads",
        slug: "leads",
        description: "Lead listing with source tracking, statuses, and ownership mapping.",
        template: "directory",
      },
      {
        label: "Pipeline",
        slug: "pipeline",
        description: "Kanban sales pipeline from new inquiry through closure.",
        template: "kanban",
      },
      {
        label: "Site Visits",
        slug: "site-visits",
        description: "Visit scheduling calendar and engagement outcomes placeholders.",
        template: "directory",
      },
      {
        label: "Customers",
        slug: "customers",
        description: "Customer master records with lifecycle and relationship context.",
        template: "directory",
      },
      {
        label: "Brokers",
        slug: "brokers",
        description: "Broker partnership management, commissions, and contribution snapshots.",
        template: "directory",
      },
      {
        label: "Follow-Ups",
        slug: "follow-ups",
        description: "Follow-up cards for upcoming calls, meetings, and pending callbacks.",
        template: "activity",
      },
      {
        label: "Sales Insights",
        slug: "sales-insights",
        description: "Sales analytics placeholders for funnel and conversion trends.",
        template: "analytics",
      },
    ],
  },
  {
    label: "Projects",
    slug: "projects",
    icon: "Building2",
    description: "Execution planning, site progress, tasks, and project analytics.",
    roles: allRoles,
    pages: [
      {
        label: "All Projects",
        slug: "all-projects",
        description: "Portfolio-level project dashboard with phase and risk visibility.",
        template: "dashboard",
      },
      {
        label: "Tasks",
        slug: "tasks",
        description: "Task board for planning, assignment, and delivery tracking.",
        template: "task-board",
      },
      {
        label: "Milestones",
        slug: "milestones",
        description: "Milestone cards with completion progress and dependencies.",
        template: "milestones",
      },
      {
        label: "Daily Reports",
        slug: "daily-reports",
        description: "DPR placeholders for site updates, blockers, and shift summaries.",
        template: "daily-report",
      },
      {
        label: "Resources",
        slug: "resources",
        description: "Resource allocation table for labor, machinery, and utilization.",
        template: "resources",
      },
      {
        label: "Site Updates",
        slug: "site-updates",
        description: "Field updates timeline with status and media placeholders.",
        template: "activity",
      },
      {
        label: "Documents",
        slug: "documents",
        description: "Project document listing with categories and version placeholders.",
        template: "documents",
      },
      {
        label: "Project Insights",
        slug: "project-insights",
        description: "Project analytics placeholders for productivity and completion trends.",
        template: "analytics",
      },
    ],
  },
  {
    label: "Materials",
    slug: "materials",
    icon: "Boxes",
    description: "Inventory operations, stock movement, warehouses, and alerts.",
    roles: allRoles,
    pages: [
      {
        label: "Materials List",
        slug: "materials-list",
        description: "Master material inventory with categories and stock positioning.",
        template: "inventory",
      },
      {
        label: "Warehouses",
        slug: "warehouses",
        description: "Warehouse cards and storage utilization visibility.",
        template: "resources",
      },
      {
        label: "Stock In",
        slug: "stock-in",
        description: "Inbound stock movement records and receiving controls.",
        template: "movement",
      },
      {
        label: "Stock Out",
        slug: "stock-out",
        description: "Outbound stock issue logs and allocation details.",
        template: "movement",
      },
      {
        label: "Transfers",
        slug: "transfers",
        description: "Inter-warehouse transfer pipeline and reconciliation placeholders.",
        template: "movement",
      },
      {
        label: "Consumption",
        slug: "consumption",
        description: "Site consumption trends and issued-vs-used summaries.",
        template: "inventory",
      },
      {
        label: "Stock Alerts",
        slug: "stock-alerts",
        description: "Low-stock warnings, reorder triggers, and severity filters.",
        template: "alerts",
      },
      {
        label: "Material Reports",
        slug: "material-reports",
        description: "Material analytics templates and report exports.",
        template: "reports",
      },
    ],
  },
  {
    label: "Purchases",
    slug: "purchases",
    icon: "ShoppingCart",
    description: "Vendor operations, requisitions, quotations, orders, and approvals.",
    roles: allRoles,
    pages: [
      {
        label: "Vendors",
        slug: "vendors",
        description: "Vendor management directory and engagement health indicators.",
        template: "directory",
      },
      {
        label: "Requests",
        slug: "requests",
        description: "Purchase request intake and prioritization workspace.",
        template: "directory",
      },
      {
        label: "Quotations",
        slug: "quotations",
        description: "Quotation comparison layout with pricing and turnaround placeholders.",
        template: "comparison",
      },
      {
        label: "Purchase Orders",
        slug: "purchase-orders",
        description: "PO status cards, lifecycle progress, and fulfillment tracking.",
        template: "dashboard",
      },
      {
        label: "Approvals",
        slug: "approvals",
        description: "Approval workflow queue with stagewise status tracking.",
        template: "approvals",
      },
      {
        label: "Purchase Reports",
        slug: "purchase-reports",
        description: "Purchase analytics and export-ready report placeholders.",
        template: "reports",
      },
    ],
  },
  {
    label: "Reports & Analytics",
    slug: "reports-analytics",
    icon: "BarChart3",
    description: "Cross-functional reporting dashboards, filters, and export center.",
    roles: allRoles,
    pages: [
      {
        label: "Dashboard Reports",
        slug: "dashboard-reports",
        description: "Unified analytics dashboard templates for operational monitoring.",
        template: "reports",
      },
      {
        label: "Project Reports",
        slug: "project-reports",
        description: "Project-centric report templates with date and status filters.",
        template: "reports",
      },
      {
        label: "Workforce Reports",
        slug: "workforce-reports",
        description: "Workforce report placeholders with attendance and utilization views.",
        template: "reports",
      },
      {
        label: "Sales Reports",
        slug: "sales-reports",
        description: "Sales funnel and closure reporting placeholders.",
        template: "reports",
      },
      {
        label: "Material Reports",
        slug: "material-reports",
        description: "Inventory health report templates and trend comparisons.",
        template: "reports",
      },
      {
        label: "Financial Reports",
        slug: "financial-reports",
        description: "Finance report structures with period selectors and export actions.",
        template: "reports",
      },
      {
        label: "Export Center",
        slug: "export-center",
        description: "Central export queue and generated reports placeholders.",
        template: "reports",
      },
    ],
  },
  {
    label: "Management",
    slug: "management",
    icon: "BriefcaseBusiness",
    description: "Executive control room for strategic and operational governance.",
    roles: allRoles,
    pages: [
      {
        label: "Executive Dashboard",
        slug: "executive-dashboard",
        description: "Premium executive dashboard with top-level KPIs and trend snapshots.",
        template: "executive",
      },
      {
        label: "Project Health",
        slug: "project-health",
        description: "Project health indicators and risk projection placeholders.",
        template: "health",
      },
      {
        label: "Financial Overview",
        slug: "financial-overview",
        description: "Executive finance overview with revenue, cost, and margin trends.",
        template: "financial",
      },
      {
        label: "Operational Overview",
        slug: "operational-overview",
        description: "Operations performance snapshot across execution functions.",
        template: "operational",
      },
      {
        label: "Business Insights",
        slug: "business-insights",
        description: "Strategic insight cards with enterprise decision indicators.",
        template: "insights",
      },
    ],
  },
  {
    label: "Alerts",
    slug: "alerts",
    icon: "BellRing",
    description: "Priority alerts, risk indicators, and operational warning streams.",
    roles: allRoles,
    pages: [
      {
        label: "Project Alerts",
        slug: "project-alerts",
        description: "Project exception alerts with timeline and severity views.",
        template: "alerts",
      },
      {
        label: "Material Alerts",
        slug: "material-alerts",
        description: "Stock and supply-chain alert feeds with quick triage cards.",
        template: "alerts",
      },
      {
        label: "Workforce Alerts",
        slug: "workforce-alerts",
        description: "Workforce attendance and productivity anomaly alerts.",
        template: "alerts",
      },
      {
        label: "Approval Alerts",
        slug: "approval-alerts",
        description: "Pending and overdue approval alert queues by workflow.",
        template: "alerts",
      },
      {
        label: "Risk Indicators",
        slug: "risk-indicators",
        description: "Risk scoring indicators and cross-functional warning summaries.",
        template: "alerts",
      },
    ],
  },
  {
    label: "Settings",
    slug: "settings",
    icon: "Settings2",
    description: "Configuration controls for company, users, notifications, and workflows.",
    roles: allRoles,
    pages: [
      {
        label: "Company Settings",
        slug: "company-settings",
        description: "Organization-level profile, branding, and operational defaults.",
        template: "settings",
      },
      {
        label: "Users & Permissions",
        slug: "users-permissions",
        description: "Role management layout and permission matrix placeholders.",
        template: "permissions",
      },
      {
        label: "Notification Settings",
        slug: "notification-settings",
        description: "Notification channels, frequency rules, and alert behavior controls.",
        template: "settings",
      },
      {
        label: "Workflow Settings",
        slug: "workflow-settings",
        description: "Business workflow configurations and approval policy controls.",
        template: "settings",
      },
      {
        label: "System Preferences",
        slug: "system-preferences",
        description: "System-level preferences and platform behavior settings.",
        template: "settings",
      },
    ],
  },
];

export function getSectionBySlug(sectionSlug: string): NavSection | undefined {
  return navSections.find((section) => section.slug === sectionSlug);
}

export function getPageBySlug(sectionSlug: string, pageSlug: string): NavPage | undefined {
  const section = getSectionBySlug(sectionSlug);
  if (!section) return undefined;
  return section.pages.find((page) => page.slug === pageSlug);
}

export function getPageHref(sectionSlug: string, pageSlug: string): string {
  return `/${sectionSlug}/${pageSlug}`;
}

export function getSectionDefaultHref(section: NavSection): string {
  const firstPage = section.pages[0];
  return firstPage ? getPageHref(section.slug, firstPage.slug) : `/${section.slug}`;
}

export function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; href: string }> = [{ label: "Workspace", href: "/" }];

  if (segments.length === 0) return crumbs;

  const section = getSectionBySlug(segments[0]);
  if (!section) {
    let unknownPath = "";
    for (const segment of segments) {
      unknownPath += `/${segment}`;
      crumbs.push({ label: formatSegment(segment), href: unknownPath });
    }
    return crumbs;
  }

  crumbs.push({ label: section.label, href: `/${section.slug}` });

  if (segments.length > 1) {
    const page = getPageBySlug(section.slug, segments[1]);
    crumbs.push({
      label: page?.label ?? formatSegment(segments[1]),
      href: `/${section.slug}/${segments[1]}`,
    });
  }

  return crumbs;
}
