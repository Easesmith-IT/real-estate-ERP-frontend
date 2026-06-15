import { UserRole } from "@/types/navigation";

export type DemoRole = UserRole;

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  designation: string;
  permissions: string[];
};

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  source: string;
  assignedTo: string;
  assignedToName: string;
  brokerId?: string | null;
  brokerName?: string | null;
  preferredProjectId: string;
  preferredConfiguration: string;
  projectName: string;
  budgetMin: number;
  budgetMax: number;
  budgetLabel: string;
  stage: string;
  followUpAt: string;
  notes: string;
  hasActiveBooking: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeadListResponse = {
  items: Lead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stages: string[];
};

export type LeadStats = {
  activeLeads: number;
  scheduledVisits: number;
  highValue: number;
  bookedThisCycle: number;
  stageCounts: Array<{ stage: string; count: number }>;
};

export type PipelineResponse = {
  stages: Array<{ stage: string; leads: Lead[] }>;
  totals: {
    activeLeads: number;
    won: number;
    lost: number;
  };
};

export type Broker = {
  id: string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  commissionRate: number;
  activeDeals: number;
  preferredProjects?: string[];
  status?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
};

export type SiteVisit = {
  id: string;
  leadId: string;
  leadName: string;
  projectId: string;
  projectName: string;
  coordinatorId: string;
  coordinatorName: string;
  status: string;
  outcome: string;
  scheduledAt: string;
  notes?: string;
  followUpDate?: string | null;
  reminderSettings?: { email: boolean; sms: boolean; whatsapp: boolean };
  conversionScore?: number;
  createdAt: string;
};

export type SiteVisitsResponse = {
  visits: SiteVisit[];
  coordinators: DemoUser[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  bookingCount: number;
  totalBookedValue: number;
  outstandingAmount: number;
  sourceLeadId?: string | null;
  sourceLeadName?: string | null;
  createdAt: string;
};

export type CustomerResponse = {
  customers: Customer[];
  brokers: Broker[];
};

export type Unit = {
  id: string;
  code: string;
  status: string;
  configuration: string;
  floorLabel: string;
  towerName: string;
  projectId: string;
  projectName: string;
  areaSqFt: number;
  facing: string;
  view: string;
  finalPrice: number;
  bookingId?: string | null;
};

export type ProjectSummary = {
  id: string;
  name: string;
  code: string;
  location: string;
  stage: string;
  managerName: string;
  totalUnits: number;
  availableUnits: number;
  bookedUnits: number;
  inventoryValue: number;
};

export type PropertySummaryResponse = {
  projects: ProjectSummary[];
  units: Unit[];
};

export type Reservation = {
  id: string;
  leadId: string;
  leadName: string;
  unitId: string;
  unitCode: string;
  projectId: string;
  projectName: string;
  notes: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  isExpired: boolean;
};

export type ReservationResponse = {
  reservations: Reservation[];
};

export type Booking = {
  id: string;
  leadId: string;
  leadName?: string | null;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  projectId: string;
  projectName: string;
  unitId: string;
  unitCode: string;
  paymentPlanType: string;
  totalAmount: number;
  outstandingAmount: number;
  totalPaid: number;
  status: string;
  agreementStatus: string;
  bookingDate: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  scheduleSummary: Array<{
    id: string;
    label: string;
    amount: number;
    dueDate: string;
    status: string;
    paidAmount: number;
  }>;
};

export type BookingResponse = {
  bookings: Booking[];
  paymentPlanTypes: string[];
};

export type Receipt = {
  id: string;
  bookingId: string;
  amount: number;
  mode: string;
  reference: string;
  receivedAt: string;
  customerName: string;
  collectedByName: string;
};

export type PaymentSummary = {
  totalReceipts: number;
  outstanding: number;
  dueSoonAmount: number;
  overdueCount: number;
  dueSoonSchedules: Array<{
    id: string;
    bookingId: string;
    customerName: string;
    unitCode: string;
    projectName: string;
    label: string;
    amount: number;
    dueDate: string;
    status: string;
    paidAmount: number;
  }>;
  recentReceipts: Receipt[];
};

export type DashboardResponse = {
  kpis: {
    activeLeads: number;
    scheduledVisits: number;
    activeBookings: number;
    totalOutstanding: number;
  };
  projectPortfolio: ProjectSummary[];
  recentActivity: AuditLog[];
  upcomingFollowUps: Lead[];
  collections: PaymentSummary;
};

export type DashboardMetricFormat = "number" | "currency" | "percent" | "decimal";

export type DashboardMetric = {
  id: string;
  label: string;
  format: DashboardMetricFormat;
  value: number;
  trendPercent: number;
  status: "healthy" | "watch" | "critical" | "neutral";
  sparkline: number[];
};

export type DashboardProjectHealthCard = {
  id: string;
  name: string;
  stage: string;
  completion: number;
  riskScore: number;
  riskLevel: string;
  tone: "healthy" | "attention" | "critical";
  statusLabel: string;
  signalCount: number;
  nextDueAt: string | null;
  delayedMilestones: number;
  materialShortages: number;
  workforcePressure: boolean;
};

export type DashboardOverviewResponse = {
  generatedAt: string;
  portfolio: {
    current: string;
    options: string[];
    healthScore: number;
    healthDelta: number;
    tone: "healthy" | "critical" | "watch" | "neutral";
    narrative: string;
  };
  executiveKpis: DashboardMetric[];
  operationsKpis: DashboardMetric[];
  projectHealth: {
    summary: {
      healthy: number;
      attention: number;
      critical: number;
    };
    projects: DashboardProjectHealthCard[];
  };
  revenueCollections: {
    totals: {
      revenue: number;
      collections: number;
      collectionRate: number;
      overdueAmount: number;
    };
    monthlyTrend: Array<{
      month: string;
      revenue: number;
      collections: number;
    }>;
    aging: Array<{
      bucket: string;
      north: number;
      south: number;
      total: number;
    }>;
  };
  actionCenter: {
    counts: Array<{
      label: string;
      value: number;
    }>;
    quickActions: Array<{
      label: string;
      route: string;
    }>;
  };
  workforceDistribution: Array<{
    name: string;
    value: number;
  }>;
};

export type DashboardProjectHealthResponse = {
  generatedAt: string;
  summary: {
    healthyProjects: number;
    atRiskProjects: number;
    criticalProjects: number;
  };
  projects: DashboardProjectHealthCard[];
};

export type DashboardAnalyticsResponse = {
  generatedAt: string;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    collections: number;
  }>;
  leadFunnel: Array<{
    stage: string;
    value: number;
  }>;
  monthlyLeadTrend: Array<{
    month: string;
    value: number;
  }>;
  workforceDistribution: Array<{
    name: string;
    value: number;
  }>;
  inventoryDistribution: Array<{
    category: string;
    value: number;
  }>;
  topProjectsByValue: Array<{
    id: string;
    name: string;
    value: number;
  }>;
};

export type DashboardRecommendation = {
  id: string;
  type: string;
  priority: "low" | "medium" | "high";
  color: "green" | "yellow" | "red";
  title: string;
  detail: string;
  actionLabel: string;
  actionRoute: string;
};

export type DashboardRecommendationsResponse = {
  generatedAt: string;
  opportunities: DashboardRecommendation[];
  risks: DashboardRecommendation[];
  alerts: DashboardRecommendation[];
  items: DashboardRecommendation[];
};

export type DashboardActivityItem = {
  id: string;
  type: string;
  title: string;
  detail: string;
  actorName: string;
  avatarLabel: string;
  iconKey: string;
  timestamp: string;
  relativeTime: string;
};

export type DashboardActivityFeedResponse = {
  generatedAt: string;
  items: DashboardActivityItem[];
};

export type FinancialOverview = PaymentSummary & {
  projectBreakdown: Array<{
    bookingId: string;
    projectName: string;
    customerName: string;
    totalAmount: number;
    outstandingAmount: number;
    paymentPlanType: string;
  }>;
};

export type PermissionMatrix = {
  modules: string[];
  rows: Array<Record<string, string>>;
};

export type AuditLog = {
  id: string;
  title: string;
  detail: string;
  category: string;
  actorName: string;
  createdAt: string;
};

export type AdminSettings = {
  workflowSettings: Array<{ id: string; name: string; code: string; defaultValue: string; status: string }>;
  notificationSettings: Array<{ id: string; name: string; code: string; defaultValue: string; status: string }>;
  permissionsMatrix: PermissionMatrix;
  auditLogs: AuditLog[];
};

export type UserDirectoryResponse = {
  users: DemoUser[];
  roles: Array<{ key: string; permissions: string[] }>;
};

export type ApprovalItem = {
  id: string;
  title: string;
  module: string;
  requestType: string;
  priority: string;
  status: string;
  requestedBy: string;
  requestedByName: string;
  ownerId: string;
  ownerName: string;
  submittedAt: string;
  dueAt: string;
  summary: string;
  actedAt?: string | null;
  actedBy?: string | null;
  actedByName?: string | null;
  relatedEntityId?: string | null;
};

export type ApprovalsResponse = {
  approvals: ApprovalItem[];
  summary: {
    pending: number;
    approvedThisWeek: number;
    overdue: number;
    highPriority: number;
  };
};

export type DocumentRecord = {
  id: string;
  title: string;
  category: string;
  module: string;
  projectId?: string | null;
  projectName: string;
  relatedEntityId?: string | null;
  version: string;
  status: string;
  ownerId: string;
  ownerName: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  expiryDate?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  originalName?: string | null;
};

export type DocumentRegisterResponse = {
  documents: DocumentRecord[];
  categories: string[];
};

export type ComplianceItem = {
  id: string;
  projectId: string;
  projectName: string;
  approvalType: string;
  authority: string;
  status: string;
  expiryDate: string;
  ownerId: string;
  ownerName: string;
  documentId?: string | null;
  documentTitle?: string | null;
  notes: string;
};

export type ComplianceResponse = {
  items: ComplianceItem[];
  summary: {
    expiringSoon: number;
    inReview: number;
    compliant: number;
  };
};

export type AlertItem = {
  id: string;
  category: string;
  title: string;
  severity: string;
  ownerName: string;
  source: string;
  dueAt: string;
  message: string;
};

export type AlertsResponse = {
  alerts: AlertItem[];
  summary: {
    critical: number;
    high: number;
    medium: number;
  };
};

export type DashboardReportsResponse = {
  summaryCards: Array<{ label: string; value: string | number; trend: string }>;
  trendBuckets: Array<{ label: string; items: Array<{ label: string; count: number }> }>;
};

export type ExecutiveDashboardResponse = {
  executiveKpis: {
    portfolioValue: number;
    collectionsOutstanding: number;
    approvalQueue: number;
    complianceExposure: number;
  };
  watchlist: AlertItem[];
  projectRiskBoard: Array<{
    id: string;
    projectName: string;
    bookedUnits: number;
    availableUnits: number;
    stage: string;
    riskLevel: string;
    riskScore: number;
    openSignals: number;
    primaryRisk: string;
  }>;
  executiveNotes: string[];
};

export type ProjectTask = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  ownerId: string;
  ownerName: string;
  discipline: string;
  priority: string;
  status: string;
  dueDate: string;
  completion: number;
};

export type ProjectTasksResponse = {
  tasks: ProjectTask[];
  summary: {
    planned: number;
    inProgress: number;
    review: number;
    done: number;
  };
};

export type DailyReport = {
  id: string;
  projectId: string;
  projectName: string;
  submittedBy: string;
  submittedByName: string;
  reportDate: string;
  laborCount: number;
  materialUsage: string;
  blockers: string;
  progressSummary: string;
  shift?: string;
  siteEngineer?: string;
  progressPercent?: number;
  weather?: string;
  blockersLevel?: string;
  siteHealth?: number;
  remarks?: string;
  materials?: {
    cement?: number;
    steel?: number;
    sand?: number;
    aggregates?: number;
  };
  laborDetails?: {
    skilled?: number;
    unskilled?: number;
    supervisors?: number;
  };
  photos?: string[];
};

export type DailyReportsResponse = {
  reports: DailyReport[];
};

export type ResourceAllocation = {
  id: string;
  projectId: string;
  projectName: string;
  resourceName: string;
  type: string;
  subType?: string;
  assignedTo: string;
  utilization: number;
  status?: string;
  health?: number;
  dailyCost?: number;
  monthlyCost?: number;
};

export type ResourcesResponse = {
  resources: ResourceAllocation[];
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  city: string;
  gstin: string;
  averageLeadTimeDays: number;
  reliabilityScore: number;
  status: string;
  lastOrderDate: string;
};

export type VendorsResponse = {
  vendors: Vendor[];
};

export type PurchaseRequest = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  department: string;
  requestedBy: string;
  requestedByName: string;
  materialCategory: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  requiredBy: string;
  createdAt: string;
};

export type PurchaseRequestsResponse = {
  requests: PurchaseRequest[];
};

export type Quotation = {
  id: string;
  requestId: string;
  requestTitle: string;
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  deliveryDays: number;
  paymentTerms: string;
  qualityScore: number;
  status: string;
  submittedAt: string;
  documentUrl?: string | null;
  documentName?: string | null;
  documentSize?: number | null;
  createdAt?: string;
  notes?: string;
};

export type QuotationsResponse = {
  quotations: Quotation[];
};

export type LineItem = {
  item: string;
  category: string;
  quantity: number;
  unit: string;
  rate: number;
  tax: number;
  amount: number;
};

export type TimelineEvent = {
  status: string;
  title: string;
  timestamp: string;
  actorName: string;
};

export type PurchaseOrder = {
  id: string;
  requestId: string;
  requestTitle: string;
  vendorId: string;
  vendorName: string;
  projectId: string;
  projectName: string;
  amount: number;
  status: string;
  expectedDelivery: string;
  createdAt: string;
  lineItems?: LineItem[];
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  documentUrl?: string;
  timeline?: TimelineEvent[];
  vendorDetails?: any;
  projectDetails?: any;
};

export type PurchaseOrdersResponse = {
  purchaseOrders: PurchaseOrder[];
};

export type Warehouse = {
  id: string;
  name: string;
  code?: string;
  location: string;
  region?: string;
  coordinates?: {
    lat?: string;
    lng?: string;
  };
  capacity?: number;
  capacityUtilization: number;
  storageTypes?: string[];
  operatingHours?: string;
  supervisor?: string;
  assignedProjects?: string[];
  materialCategories?: string[];
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Material = {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  projectId: string;
  projectName: string;
  onHand: number;
  reorderLevel: number;
  unit: string;
  averageConsumption: number;
  status: string;
};

export type MaterialsResponse = {
  materials: Material[];
  warehouses: Warehouse[];
};

export type MaterialTransfer = {
  id: string;
  materialId: string;
  materialName: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  quantity: number;
  unit: string;
  status: string;
  requestedBy: string;
  requestedByName: string;
  createdAt: string;
};

export type MaterialTransfersResponse = {
  transfers: MaterialTransfer[];
};

export type MaterialConsumption = {
  id: string;
  materialId: string;
  materialName: string;
  projectId: string;
  projectName: string;
  quantity: number;
  unit: string;
  consumedOn: string;
  recordedBy: string;
  recordedByName: string;
  purpose: string;
};

export type MaterialConsumptionResponse = {
  consumptions: MaterialConsumption[];
};

export type MaterialAlertsResponse = {
  alerts: Array<{
    id: string;
    materialName: string;
    warehouseName: string;
    projectName: string;
    onHand: number;
    reorderLevel: number;
    status: string;
  }>;
  summary: {
    lowStock: number;
    critical: number;
  };
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  position: string;
  projectId: string;
  projectName: string;
  projectRole: string;
  teamName: string;
  phone: string;
  dateJoined: string;
  emergencyContact: string;
  address: string;
  status: string;
  reportingManager: string;
  attendancePercent: number;
  attendanceLabel: string;
  attendanceMonthLabel: string;
  attendanceSparkline: number[];
  utilizationPercent: number;
  yearsOfService: number;
  isNewJoiner: boolean;
};

export type EmployeesResponse = {
  employees: Employee[];
  meta?: {
    total: number;
    active: number;
    inactive: number;
  };
};

export type EmployeeAttendanceTrendPoint = {
  month: string;
  attendanceRate: number;
  presentDays: number;
  lateArrivals: number;
  absentDays: number;
};

export type EmployeeTimelineItem = {
  id: string;
  year: string;
  projectId: string;
  projectName: string;
  role: string;
  startDate: string;
  status: string;
};

export type EmployeeDocumentRecord = {
  id: string;
  title: string;
  status: string;
  uploadedAt: string;
  fileName: string;
};

export type EmployeeActivityItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: string;
};

export type EmployeeDetailResponse = {
  employee: Employee;
  summary: {
    attendancePercent: number;
    projectsAssigned: number;
    teamsAssigned: number;
    yearsOfService: number;
  };
  assignment: {
    projectName: string;
    role: string;
    projectStartDate: string;
    reportingManager: string;
  };
  personalInformation: {
    email: string;
    phone: string;
    emergencyContact: string;
    dateOfBirth: string;
    address: string;
  };
  employmentInformation: {
    employeeCode: string;
    department: string;
    designation: string;
    position: string;
    dateJoined: string;
    reportingManager: string;
  };
  attendanceAnalytics: {
    monthlyTrend: EmployeeAttendanceTrendPoint[];
    summary: {
      presentDays: number;
      lateArrivals: number;
      absentDays: number;
    };
  };
  allocationTimeline: EmployeeTimelineItem[];
  documents: EmployeeDocumentRecord[];
  activity: EmployeeActivityItem[];
};

export type Contractor = {
  id: string;
  name: string;
  trade: string;
  projectId: string;
  projectName: string;
  workforce: number;
  status: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  contractStart?: string;
  contractEnd?: string;
  rateType?: string;
  rateValue?: number;
  rating?: number;
  complianceStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContractorsResponse = {
  contractors: Contractor[];
};

export type ContractorEngagementHistory = {
  id: string;
  projectId: string;
  projectName: string;
  duration: string;
  workforceDeployed: number;
  performanceRating: number;
  status: string;
};

export type ContractorWorkforceBreakdown = {
  skilled: number;
  semiSkilled: number;
  supervisors: number;
  engineers: number;
  laborers: number;
};

export type ContractorDocument = {
  id: string;
  name: string;
  status: string;
  expiryDate: string;
  documentType: string;
};

export type ContractorPerformanceMetrics = {
  workforceTrend: { date: string; value: number }[];
  productivityTrend: { date: string; value: number }[];
  attendanceTrend: { date: string; value: number }[];
  projectContribution: { name: string; value: number }[];
};

export type ContractorFinancialSummary = {
  invoicesRaised: number;
  invoicesPaid: number;
  outstandingAmount: number;
  paymentPerformance: string;
};

export type ContractorTimelineItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  category: string;
};

export type ContractorDetail = {
  profile: Contractor;
  engagementHistory: ContractorEngagementHistory[];
  workforceBreakdown: ContractorWorkforceBreakdown;
  complianceSummary: {
    agreementStatus: string;
    insuranceStatus: string;
    licenseStatus: string;
    safetyCertification: string;
  };
  performanceMetrics: ContractorPerformanceMetrics;
  financialSummary: ContractorFinancialSummary;
  timelineData: ContractorTimelineItem[];
  documents: ContractorDocument[];
};

export type ContractorDetailResponse = ContractorDetail;

export type AttendanceEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  shift: string;
  checkIn: string;
  status: string;
};

export type AttendanceResponse = {
  attendance: AttendanceEntry[];
  summary: {
    present: number;
    late: number;
    absent: number;
  };
};

export type ProjectRiskSignal = {
  id: string;
  projectId: string;
  projectName: string;
  signalType: string;
  title: string;
  severity: string;
  scoreImpact: number;
  ownerName: string;
  detail: string;
  metricLabel: string;
  metricValue: string;
  dueAt: string | null;
};

export type ProjectRiskProject = {
  id: string;
  projectName: string;
  stage: string;
  bookedUnits: number;
  availableUnits: number;
  riskScore: number;
  riskLevel: string;
  openSignals: number;
  delayedTasks: number;
  delayedMilestones: number;
  materialShortages: number;
  criticalMaterialShortages: number;
  presentLabor: number;
  lateLabor: number;
  engagedContractorWorkforce: number;
  averageResourceUtilization: number;
  latestReportSummary: string;
  latestReportDate: string | null;
  nextDueAt: string | null;
  primaryRisk: string;
  signals: ProjectRiskSignal[];
};

export type ProjectRiskResponse = {
  summary: {
    totalProjects: number;
    criticalProjects: number;
    watchProjects: number;
    healthyProjects: number;
    totalSignals: number;
    delayedTaskSignals: number;
    milestoneSignals: number;
    workforceSignals: number;
    materialSignals: number;
  };
  projects: ProjectRiskProject[];
  alerts: ProjectRiskSignal[];
  rules: Array<{
    id: string;
    title: string;
    threshold: string;
    description: string;
  }>;
  generatedAt: string;
};

export type NotificationCenterItem = {
  id: string;
  title: string;
  message: string;
  category: string;
  severity: string;
  source: string;
  status: string;
  read: boolean;
  createdAt: string;
  dueAt: string | null;
  actionLabel: string;
  actionRoute: string;
};

export type NotificationsResponse = {
  notifications: NotificationCenterItem[];
  summary: {
    total: number;
    unread: number;
    critical: number;
    high: number;
    info: number;
  };
  generatedAt: string;
};

export type AssistantCommandPreset = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  route: string;
};

export type AssistantSignal = {
  label: string;
  value: string;
  tone: "neutral" | "info" | "warning" | "success" | "error";
  detail: string;
};

export type AssistantRecommendation = {
  id: string;
  title: string;
  detail: string;
  priority: string;
  route: string;
  actionLabel: string;
};

export type AssistantOverviewResponse = {
  mode: "demo-simulation";
  headline: string;
  summary: string;
  signals: AssistantSignal[];
  recommendations: AssistantRecommendation[];
  suggestedCommands: AssistantCommandPreset[];
  generatedAt: string;
};

export type AssistantCommandResponse = {
  mode: "demo-simulation";
  commandId: string;
  title: string;
  summary: string;
  insights: string[];
  recommendations: AssistantRecommendation[];
  generatedAt: string;
  matchedQuery?: string;
};
