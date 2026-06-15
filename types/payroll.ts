export interface PayrollEmployeeSummary {
  id: string;
  name: string;
  department: string;
  designation: string;
  projectName: string;
  projectRole: string;
  presentDays: number;
  lateDays: number;
  hoursWorked: number;
  dailyRate: number;
  grossPayEstimate: number;
  recommendedPay: number;
  status: "On Track" | "Review" | "Needs Attention";
}

export interface PayrollRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: "Success" | "Warning" | "Critical" | "Information";
  status: "success" | "warning" | "critical" | "info";
  action: string;
}

export interface PayrollAnalytics {
  monthlyTrend: { month: string; cost: number }[];
  costByDepartment: { department: string; cost: number }[];
  payrollDistribution: { name: string; value: number }[];
  efficiencyTrend: { label: string; attendance: number; payrollEfficiency: number }[];
  topProjects: { project: string; cost: number }[];
}

export interface PayrollResponse {
  employees: PayrollEmployeeSummary[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    pageCount: number;
  };
  analytics: PayrollAnalytics;
  summaries: {
    monthlyPayrollCost: number;
    monthlyPayrollCostTrend: string;
    payrollLiability: number;
    payrollLiabilityStatus: string;
    costPerProject: number;
    costPerProjectTrend: string;
    attendanceEfficiency: number;
    attendanceEfficiencyStatus: string;
    payrollUtilization: number;
    payrollUtilizationStatus: string;
    productivityIndex: number;
    productivityIndexStatus: string;
    sparklines: {
      monthlyCost: number[];
      liability: number[];
      costPerProject: number[];
      attendance: number[];
      utilization: number[];
      productivity: number[];
    };
  };
  recommendations: PayrollRecommendation[];
  projectLaborCosts: {
    projectName: string;
    laborCost: number;
    workforceCount: number;
    costTrend: string;
    efficiencyScore: number;
  }[];
  productivityMatrix: {
    department: string;
    attendanceRate: number;
    payrollCost: number;
    productivityScore: number;
    costEfficiency: number;
  }[];
}
