export type UserRole = "admin" | "manager" | "accountant" | "sales";

export type NavPageTemplate =
  | "dashboard"
  | "activity"
  | "quick-actions"
  | "directory"
  | "attendance"
  | "analytics"
  | "kanban"
  | "task-board"
  | "milestones"
  | "daily-report"
  | "resources"
  | "documents"
  | "inventory"
  | "movement"
  | "alerts"
  | "comparison"
  | "approvals"
  | "reports"
  | "executive"
  | "health"
  | "financial"
  | "operational"
  | "insights"
  | "settings"
  | "permissions"
  | "overview";

export type NavPage = {
  label: string;
  slug: string;
  description: string;
  template: NavPageTemplate;
};

export type NavSection = {
  label: string;
  slug: string;
  icon: string;
  description: string;
  roles: UserRole[];
  pages: NavPage[];
};
