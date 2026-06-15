"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Info,
  Zap,
  Layers,
  Check,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Building,
  Briefcase,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

// Helper for large Indian Rupee format (e.g. ₹4.2 Cr or ₹1.8 Cr)
function formatCrVal(value: number, decimals: number = 1) {
  return `₹${value.toFixed(decimals)} Cr`;
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

// Custom Sparkline Component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((val, i) => ({ index: i, value: val }));
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            fill={`url(#grad-${color.replace("#", "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BusinessInsightsWorkspace() {
  // Global States
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [activeTab, setActiveTab] = useState<
    "sales" | "projects" | "finance" | "workforce" | "procurement"
  >("sales");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minute countdown
  const [exportingType, setExportingType] = useState<"csv" | "pdf" | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportToast, setShowExportToast] = useState<string | null>(null);

  // Full Screen Chart Modal State
  const [maximizedChart, setMaximizedChart] = useState<{
    title: string;
    type: "leadFunnel" | "leadTrend" | "sourcePerf" | "leadQuality" |
          "projProgress" | "invVelocity" | "unsoldInv" | "riskHeatmap" |
          "revColl" | "aging" | "cashflow" | "payment" |
          "workforceAttendance" | "workforceProd" | "roleUtilization" | "deptEfficiency" |
          "procureCons" | "procurePurch" | "vendorLead" | "fulfillGap";
  } | null>(null);

  // Drill Down State
  const [drillDownItem, setDrillDownItem] = useState<{
    category: string;
    label: string;
    details: Array<{ key: string; value: string }>;
  } | null>(null);

  // Interactive Correlation Center States
  const [selectedCorrelationPath, setSelectedCorrelationPath] = useState<"supply" | "capital" | "growth">("supply");

  // Table Sorting, Searching, Pagination & Expand States
  const [tableSearch, setTableSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>({});

  // Recommendation Approvals Log
  const [approvedRecommendations, setApprovedRecommendations] = useState<Record<string, { processing: boolean; approved: boolean; date?: string }>>({});

  // Auto-refresh countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
      setCountdown(120);
      // Show quick notification toast
      setShowExportToast("Data source successfully re-synchronized with live ERP database.");
      setTimeout(() => setShowExportToast(null), 3500);
    }, 1000);
  };

  // Reset pagination on search change or tab change
  useEffect(() => {
    setCurrentPage(1);
    setTableSearch("");
    setExpandedRows({});
  }, [activeTab]);

  // Export handlers
  const handleExport = (type: "csv" | "pdf") => {
    setExportingType(type);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setExportingType(null);
            setShowExportToast(`Successfully compiled and downloaded Business_${activeTab}_intelligence_report.${type}`);
            setTimeout(() => setShowExportToast(null), 4000);
          }, 500);
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  // Recommendations execute handler
  const executeRecommendation = (id: string, name: string) => {
    setApprovedRecommendations((prev) => ({
      ...prev,
      [id]: { processing: true, approved: false }
    }));

    setTimeout(() => {
      setApprovedRecommendations((prev) => ({
        ...prev,
        [id]: {
          processing: false,
          approved: true,
          date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      }));
      setShowExportToast(`Recommendation Applied: ${name} executed successfully.`);
      setTimeout(() => setShowExportToast(null), 4000);
    }, 1500);
  };

  // Mock Datasets & Colors
  const themeColors = {
    blue: "#2563eb",
    emerald: "#16a34a",
    amber: "#d97706",
    red: "#dc2626",
    purple: "#9333ea",
    cyan: "#0891b2",
    slate: "#64748b"
  };

  const businessHealthScore = 89;

  const healthSections = [
    { name: "Revenue Health", score: 92, trend: "↑ 1.8%", target: "90", driver: "Luxury Residential Sales", status: "Above Target", color: themeColors.emerald, sparkline: [88, 89, 91, 90, 92, 92] },
    { name: "Project Health", score: 84, trend: "↑ 2.4%", target: "85", driver: "On-Time Milestones", status: "On Track", color: themeColors.blue, sparkline: [80, 81, 83, 82, 85, 84] },
    { name: "Workforce Health", score: 88, trend: "↓ 0.5%", target: "90", driver: "Attendance Variance", status: "Needs Attention", color: themeColors.purple, sparkline: [90, 89, 88, 88, 89, 88] },
    { name: "Procurement Health", score: 79, trend: "↓ 1.2%", target: "85", driver: "Steel Lead Time Delays", status: "Watch", color: themeColors.amber, sparkline: [82, 81, 80, 79, 78, 79] },
    { name: "Collection Health", score: 81, trend: "↑ 3.1%", target: "80", driver: "Improved Recovery Rate", status: "Healthy", color: themeColors.cyan, sparkline: [75, 78, 79, 80, 80, 81] }
  ];

  // Tab Details & Metrics
  const tabData = {
    sales: {
      kpis: [
        { label: "Active Leads", value: "1,248", trend: "+12.4%", desc: "Pipeline: ₹4.8 Cr", color: themeColors.blue, sparkline: [1050, 1100, 1150, 1200, 1220, 1248] },
        { label: "Conversion Rate", value: "4.8%", trend: "-0.6%", desc: "Target: 5.5%", color: themeColors.red, sparkline: [5.2, 5.1, 5.0, 4.9, 4.7, 4.8] },
        { label: "Avg Days To Close", value: "18 Days", trend: "-3.2%", desc: "Industry avg: 24d", color: themeColors.emerald, sparkline: [22, 21, 20, 19, 19, 18] },
        { label: "Source Win Rate", value: "24.5%", trend: "+2.1%", desc: "Broker leading", color: themeColors.purple, sparkline: [22, 23, 23.5, 24, 24.2, 24.5] }
      ],
      insight: "Broker sourced leads convert 2.3x better than website leads. Scale commission incentives for Q3 launch.",
      tableData: [
        { id: 1, name: "Smart Heights Commercial Suite A", source: "Broker (Prime Realtors)", value: 45000000, quality: "High (8.8)", stage: "Negotiation", days: 14, manager: "Amit S." },
        { id: 2, name: "Heritage Villa Phase 2 Block B", source: "Direct Referral", value: 38000000, quality: "High (9.2)", stage: "Site Visit Scheduled", days: 8, manager: "Vikram R." },
        { id: 3, name: "Emerald Hub Retail Spaces", source: "Website Form", value: 18000000, quality: "Medium (5.5)", stage: "Contacted", days: 22, manager: "Sneha P." },
        { id: 4, name: "Horizon Tower Duplex Unit 401", source: "Digital Campaign", value: 29000000, quality: "Medium (6.1)", stage: "Interested", days: 19, manager: "Vikram R." },
        { id: 5, name: "Park View 3BHK Premium Units", source: "Broker (Global Assets)", value: 65000000, quality: "High (8.5)", stage: "Negotiation", days: 5, manager: "Amit S." },
        { id: 6, name: "Silicon Space Co-working Hall", source: "Walk-in", value: 12000000, quality: "Low (3.4)", stage: "New Lead", days: 31, manager: "Sneha P." },
        { id: 7, name: "Emerald Hub Office Blocks", source: "Broker (Prime Realtors)", value: 54000000, quality: "High (9.0)", stage: "Booking Stage", days: 11, manager: "Amit S." }
      ]
    },
    projects: {
      kpis: [
        { label: "Active Projects", value: "14", trend: "Stable", desc: "Capital Invested: ₹124 Cr", color: themeColors.blue, sparkline: [14, 14, 14, 14, 14, 14] },
        { label: "Avg Completion", value: "68.2%", trend: "+4.1%", desc: "Overall structural speed", color: themeColors.emerald, sparkline: [62, 63, 65, 66, 67, 68.2] },
        { label: "On Track %", value: "78.5%", trend: "+2.3%", desc: "11 of 14 projects on time", color: themeColors.cyan, sparkline: [75, 76, 76.8, 77.2, 78, 78.5] },
        { label: "Delayed Projects", value: "3", trend: "-25.0%", desc: "Last Month: 4 Delayed", color: themeColors.amber, sparkline: [4, 4, 3, 3, 3, 3] }
      ],
      insight: "3 critical projects (Smart Heights, Emerald Hub, Horizon Tower) share structural steel delays from SteelCorp.",
      tableData: [
        { id: 1, name: "Smart Heights Commercial", segment: "Commercial", completion: 72, target: "2026-11-15", budgetVar: "+4.2%", risk: "Critical (Steel Shortage)", delayImpact: "18 Days" },
        { id: 2, name: "Heritage Villa Phase 2", segment: "Luxury Villa", completion: 92, target: "2026-08-30", budgetVar: "-1.8%", risk: "Stable", delayImpact: "0 Days" },
        { id: 3, name: "Emerald Hub", segment: "Retail", completion: 54, target: "2027-02-10", budgetVar: "+6.8%", risk: "Critical (Concrete/Labor)", delayImpact: "25 Days" },
        { id: 4, name: "Horizon Tower", segment: "Residential", completion: 38, target: "2027-06-20", budgetVar: "+0.5%", risk: "Watch (Crane Allocation)", delayImpact: "12 Days" },
        { id: 5, name: "Park View Residences", segment: "Affordable", completion: 80, target: "2026-09-01", budgetVar: "0.0%", risk: "Stable", delayImpact: "0 Days" },
        { id: 6, name: "Silicon Space Offices", segment: "Commercial", completion: 28, target: "2027-09-15", budgetVar: "-0.9%", risk: "Stable", delayImpact: "0 Days" }
      ]
    },
    finance: {
      kpis: [
        { label: "Total Revenue", value: "₹14.5 Cr", trend: "+18.2%", desc: "Target: ₹13.0 Cr", color: themeColors.emerald, sparkline: [10.2, 11.5, 12.0, 13.1, 13.8, 14.5] },
        { label: "Collections Inflow", value: "₹9.8 Cr", trend: "+14.5%", desc: "Efficiency: 72.4%", color: themeColors.cyan, sparkline: [7.2, 7.8, 8.2, 8.9, 9.2, 9.8] },
        { label: "Outstanding Invoices", value: "₹4.7 Cr", trend: "+8.3%", desc: "₹3.2 Cr aging > 60d", color: themeColors.red, sparkline: [4.1, 4.3, 4.4, 4.5, 4.6, 4.7] },
        { label: "Collection Rate", value: "67.5%", trend: "-2.1%", desc: "Target: 75.0%", color: themeColors.amber, sparkline: [69, 68.5, 68, 67.8, 67.2, 67.5] }
      ],
      insight: "68% of outstanding receivables (₹3.2 Cr) belong to corporate unit owners in Smart Heights & Emerald Hub.",
      tableData: [
        { id: 1, customer: "Apex Tech Corp", project: "Smart Heights", dueAmount: 18000000, aging: "65 Days", followUp: "2026-06-11", status: "Critical Dispute", confidence: "Low (40%)" },
        { id: 2, customer: "HDFC Retail Outlet", project: "Emerald Hub", dueAmount: 14000000, aging: "72 Days", followUp: "2026-06-12", status: "Milestone Claims Pending", confidence: "Med (75%)" },
        { id: 3, customer: "Dr. Ravi Sharma (Villa 12)", project: "Heritage Villa", dueAmount: 4500000, aging: "18 Days", followUp: "2026-06-08", status: "Pending Bank Clearance", confidence: "High (90%)" },
        { id: 4, customer: "Vikas Developers", project: "Horizon Tower", dueAmount: 6000000, aging: "40 Days", followUp: "2026-06-10", status: "Awaiting Fit-Out", confidence: "Med (65%)" },
        { id: 5, customer: "Sunita Khanna (Apt 302)", project: "Park View", dueAmount: 1500000, aging: "12 Days", followUp: "2026-06-05", status: "Grace Period", confidence: "High (95%)" },
        { id: 6, customer: "TCS Enterprise Hub", project: "Silicon Space", dueAmount: 3000000, aging: "5 Days", followUp: "2026-06-01", status: "Invoice Raised", confidence: "High (98%)" }
      ]
    },
    workforce: {
      kpis: [
        { label: "Present Workers", value: "412 Craft", trend: "-4.2%", desc: "Capacity: 450", color: themeColors.amber, sparkline: [430, 428, 425, 418, 410, 412] },
        { label: "Attendance %", value: "88.5%", trend: "-2.3%", desc: "Safety free days: 124d", color: themeColors.red, sparkline: [91.2, 90.8, 90, 89.2, 88, 88.5] },
        { label: "Productivity Index", value: "92.4", trend: "+1.1%", desc: "Benchmark value: 90.0", color: themeColors.emerald, sparkline: [91, 91.5, 92, 92.1, 92.2, 92.4] },
        { label: "Resource Utilization", value: "84.6%", trend: "+3.5%", desc: "Target benchmark: 85.0%", color: themeColors.purple, sparkline: [81, 82.5, 83.2, 83.8, 84, 84.6] }
      ],
      insight: "Attendance drop correlates with structural steel shortages. Underutilization high in masonry teams.",
      tableData: [
        { id: 1, contractor: "A-One Builders Ltd", project: "Smart Heights", headcount: 124, attendance: "86%", efficiency: "88%", primaryActivity: "Slab Shuttering", status: "Material Stalled" },
        { id: 2, contractor: "R.K. Contractors", project: "Heritage Villa", headcount: 68, attendance: "94%", efficiency: "96%", primaryActivity: "Interior Finishing", status: "Optimal" },
        { id: 3, contractor: "S.S. Enterprises", project: "Emerald Hub", headcount: 110, attendance: "82%", efficiency: "84%", primaryActivity: "Brick Masonry", status: "Labor Deficit" },
        { id: 4, contractor: "Precision MEP", project: "Horizon Tower", headcount: 45, attendance: "91%", efficiency: "94%", primaryActivity: "Electrical Concealing", status: "Optimal" },
        { id: 5, contractor: "Galaxy Infra", project: "Park View", headcount: 65, attendance: "89%", efficiency: "92%", primaryActivity: "Plastering", status: "Optimal" }
      ]
    },
    procurement: {
      kpis: [
        { label: "Pending Orders", value: "28 POs", trend: "+16.6%", desc: "Order value: ₹3.2 Cr", color: themeColors.amber, sparkline: [22, 23, 24, 25, 27, 28] },
        { label: "Material Consumed", value: "₹3.8 Cr", trend: "+8.4%", desc: "Budget variance: -2.4%", color: themeColors.emerald, sparkline: [3.2, 3.4, 3.5, 3.6, 3.7, 3.8] },
        { label: "Active Vendors", value: "34", trend: "Stable", desc: "Strategic suppliers: 8", color: themeColors.blue, sparkline: [34, 34, 34, 34, 34, 34] },
        { label: "On-Time Delivery %", value: "72.4%", trend: "-4.8%", desc: "Target performance: 85.0%", color: themeColors.red, sparkline: [78, 77.2, 76, 75.1, 73, 72.4] }
      ],
      insight: "Two steel suppliers (SteelCorp and BuildMaterial Ltd) account for 70% of delivery delays.",
      tableData: [
        { id: 1, poNumber: "PO-2026-904", material: "Structural Reinforcement Steel", vendor: "SteelCorp Inc.", value: 12000000, leadTime: "14 Days", delay: "8 Days", status: "Delayed (Transit)" },
        { id: 2, poNumber: "PO-2026-882", material: "Ready Mix Concrete (M40)", vendor: "CementTech Ltd", value: 3500000, leadTime: "4 Days", delay: "0 Days", status: "Filled" },
        { id: 3, poNumber: "PO-2026-912", material: "Premium Marble Slabs", vendor: "BuildProps Marble", value: 6500000, leadTime: "8 Days", delay: "2 Days", status: "In Customs" },
        { id: 4, poNumber: "PO-2026-909", material: "Substation Transformers", vendor: "ElectroWire Systems", value: 4200000, leadTime: "12 Days", delay: "5 Days", status: "Delayed (Production)" },
        { id: 5, poNumber: "PO-2026-915", material: "Autoclaved Aerated Blocks", vendor: "BrickMasters Corp", value: 1800000, leadTime: "3 Days", delay: "0 Days", status: "Filled" }
      ]
    }
  };

  // Selection filtering and sorting logic for the active tab's table
  const filteredAndSortedTable = useMemo(() => {
    let list = [...tabData[activeTab].tableData];

    // Filter by search
    if (tableSearch.trim() !== "") {
      const q = tableSearch.toLowerCase();
      list = list.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    // Sort by configuration
    if (sortConfig) {
      list.sort((a: any, b: any) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (typeof valA === "string") {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
      });
    }

    return list;
  }, [activeTab, tableSearch, sortConfig]);

  // Paginated Rows calculation
  const totalRows = filteredAndSortedTable.length;
  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAndSortedTable.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSortedTable, currentPage, pageSize]);

  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const toggleRow = (id: string | number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="bg-[#f8fafc] text-slate-900 min-h-screen p-6 md:p-8 relative overflow-hidden font-sans rounded-3xl border border-slate-200 shadow-soft animate-page-in">
      {/* Background Soft Gradients */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-blue-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-purple-600/[0.04] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Global Toast Notification */}
      <AnimatePresence>
        {showExportToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-white border border-emerald-500/30 shadow-[0_4px_20px_rgba(22,163,74,0.15)] flex items-center space-x-3 backdrop-blur-xl"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="text-sm font-semibold text-emerald-600">System Feed:</span>
            <span className="text-xs text-slate-700">{showExportToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Chart Modal */}
      <AnimatePresence>
        {maximizedChart && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl p-6 relative shadow-[0_10px_50px_rgba(0,0,0,0.1)] flex flex-col"
            >
              <button
                onClick={() => setMaximizedChart(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <Minimize2 className="h-5 w-5 text-slate-600" />
              </button>
              <h3 className="text-lg font-bold text-slate-900 mb-6">{maximizedChart.title}</h3>
              <div className="h-[480px] w-full flex items-center justify-center">
                <ChartRenderer type={maximizedChart.type} colors={themeColors} fullscreen />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drill-down Sidebar / Modal */}
      <AnimatePresence>
        {drillDownItem && (
          <div className="fixed inset-0 z-[85] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="w-full max-w-lg h-full bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-2xl relative"
            >
              <button
                onClick={() => setDrillDownItem(null)}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <ChevronDown className="h-5 w-5 rotate-90 text-slate-600" />
              </button>
              <div>
                <span className="text-xs tracking-widest uppercase text-blue-600 font-semibold mb-2 block">
                  {drillDownItem.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-6">{drillDownItem.label}</h3>

                <div className="space-y-4">
                  {drillDownItem.details.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200/60"
                    >
                      <span className="text-sm text-slate-500">{item.key}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setDrillDownItem(null);
                    setShowExportToast("Drill-down action successfully delegated to module manager.");
                    setTimeout(() => setShowExportToast(null), 3000);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm text-white transition shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  Contact Account Representative
                </button>
                <button
                  onClick={() => setDrillDownItem(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-sm text-slate-600 transition cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Loader Overlay */}
      <AnimatePresence>
        {exportingType && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-96 text-center shadow-enterprise"
            >
              <h3 className="text-md font-bold text-slate-900 mb-2">Compiling Intelligence Audit</h3>
              <p className="text-xs text-slate-500 mb-4">Exporting {activeTab} analytics as {exportingType.toUpperCase()}</p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-150"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="text-xs text-blue-600 font-semibold">{exportProgress}% Completed</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 1: GLOBAL INTELLIGENCE HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-8 pb-6 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-6 w-6 text-blue-600 glow-blue animate-pulse" />
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-slate-950 bg-clip-text text-transparent">
              Business Insights
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-xl font-medium">
            Cross-functional intelligence across sales, projects, finance, workforce and procurement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex">
            {(["7d", "30d", "90d", "1y"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPeriod(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  period === t
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "7d" && "7 Days"}
                {t === "30d" && "30 Days"}
                {t === "90d" && "90 Days"}
                {t === "1y" && "1 Year"}
              </button>
            ))}
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer">
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-enterprise py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20">
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center space-x-2 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 text-slate-400" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={triggerRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {/* Countdown Indicator */}
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[11px] text-slate-600 font-semibold">
              Updated {countdown}s ago
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: ENTERPRISE HEALTH OVERVIEW */}
      <div className="mb-8 bg-white/80 border border-slate-200/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-soft">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Circular Health Indicator */}
          <div className="col-span-12 lg:col-span-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200/60 pb-6 lg:pb-0 lg:pr-6">
            <div className="relative h-32 w-32 flex items-center justify-center">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-blue-500/[0.02] rounded-full filter blur-md" />
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(15,23,42,0.04)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#healthGrad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * businessHealthScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">89</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Health Index
                </span>
              </div>
            </div>
            
            <div className="mt-4 text-center w-full px-2">
              <h3 className="text-sm font-extrabold text-slate-900">Business Health Index</h3>
              <div className="mt-1.5 mb-3.5">
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Operating Efficiently
                </span>
              </div>
              
              {/* Metrics with subtle dividers */}
              <div className="space-y-2 pt-3.5 border-t border-slate-100 text-left w-full max-w-[240px] mx-auto">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-500 font-medium">Revenue Contribution</span>
                  </div>
                  <span className="text-emerald-600 font-bold">+8.4%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-500 font-medium">Project Delivery</span>
                  </div>
                  <span className="text-emerald-600 font-bold">+4.1%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-500 font-medium">Collection Efficiency</span>
                  </div>
                  <span className="text-emerald-600 font-bold">+3.7%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-slate-500 font-medium">Workforce Utilization</span>
                  </div>
                  <span className="text-blue-600 font-bold">92%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Health Sparklines Grid */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-3">
            {healthSections.map((sec, idx) => (
              <div
                key={idx}
                className="bg-white hover:bg-slate-50/20 border border-slate-200 hover:border-slate-350 hover:-translate-y-0.5 hover:shadow-soft rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 group relative cursor-pointer"
                onClick={() => {
                  if (sec.name.includes("Revenue")) setActiveTab("finance");
                  if (sec.name.includes("Project")) setActiveTab("projects");
                  if (sec.name.includes("Workforce")) setActiveTab("workforce");
                  if (sec.name.includes("Procurement")) setActiveTab("procurement");
                  if (sec.name.includes("Collection")) setActiveTab("finance");
                }}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] text-slate-500 font-bold tracking-wider uppercase truncate max-w-[110px]" title={sec.name}>
                      {sec.name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border leading-none ${
                      sec.status === "Above Target" || sec.status === "On Track" || sec.status === "Healthy"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                        : sec.status === "Watch"
                        ? "bg-amber-50 text-amber-700 border-amber-150"
                        : "bg-red-50 text-red-750 border-red-150"
                    }`}>
                      {sec.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-baseline space-x-0.5">
                        <span className="text-xl font-black text-slate-900">{sec.score}</span>
                        <span className="text-xs text-slate-400 font-medium">/ 100</span>
                      </div>
                      <span className={`text-[10px] font-bold mt-0.5 ${
                        sec.trend.startsWith("↑") ? "text-emerald-600" : "text-red-500"
                      }`}>
                        {sec.trend} MoM
                      </span>
                    </div>
                    <Sparkline data={sec.sparkline} color={sec.color} />
                  </div>
                </div>

                <div className="mt-3.5 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Target:</span>
                    <span className="text-slate-700 font-bold">{sec.target}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Driver:</span>
                    <span className="text-slate-700 font-bold truncate max-w-[120px]" title={sec.driver}>{sec.driver}</span>
                  </div>
                </div>

                {/* Micro Hover Glow */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ backgroundColor: sec.color }}
                />
              </div>
            ))}

            {/* Executive Summary Card (6th Slot) */}
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100 hover:border-blue-200 hover:-translate-y-0.5 hover:shadow-soft rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 col-span-2 md:col-span-1">
              <div>
                <div className="flex items-center space-x-1.5 mb-2.5 pb-1.5 border-b border-blue-100/60">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Executive Summary</span>
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-start space-x-1.5 text-[10.5px] text-slate-700">
                    <span className="text-emerald-500 font-bold mt-0.5 leading-none">✓</span>
                    <span className="font-semibold leading-tight">Revenue performing above target.</span>
                  </li>
                  <li className="flex items-start space-x-1.5 text-[10.5px] text-slate-700">
                    <span className="text-emerald-500 font-bold mt-0.5 leading-none">✓</span>
                    <span className="font-semibold leading-tight">Workforce utilization remains healthy.</span>
                  </li>
                  <li className="flex items-start space-x-1.5 text-[10.5px] text-slate-700">
                    <span className="text-amber-500 font-bold mt-0.5 leading-none">!</span>
                    <span className="font-semibold leading-tight">Steel delays detected.</span>
                  </li>
                  <li className="flex items-start space-x-1.5 text-[10.5px] text-slate-700">
                    <span className="text-emerald-500 font-bold mt-0.5 leading-none">✓</span>
                    <span className="font-semibold leading-tight">Collections improved MoM.</span>
                  </li>
                  <li className="flex items-start space-x-1.5 text-[10.5px] text-slate-700">
                    <span className="text-red-500 font-bold mt-0.5 leading-none">⚠</span>
                    <span className="font-bold leading-tight text-red-650">2 projects require review.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-blue-100/40 flex items-center justify-between text-[9px] text-slate-400 font-semibold leading-none">
                <span>Updated from live indicators</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Key Strategic Highlights */}
          <div className="col-span-12 border-t border-slate-200/60 pt-6 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Strategic Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Opportunity Card */}
              <div 
                className="bg-white hover:bg-slate-50/20 border border-slate-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-soft rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all duration-200 group relative cursor-pointer"
                onClick={() => setActiveTab("sales")}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Top Opportunity</span>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase border border-emerald-100 rounded leading-none">High Conf</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition duration-150 leading-snug">
                    Broker Commission Optimization
                  </h4>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Potential Impact:</span>
                      <span className="text-slate-900 font-black">₹2.4 Cr</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Confidence:</span>
                      <span className="text-slate-700 font-bold">High</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform duration-150">
                  <span>Optimize Commission Rate</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Risk Card */}
              <div 
                className="bg-white hover:bg-slate-50/20 border border-slate-200 hover:border-red-300 hover:-translate-y-0.5 hover:shadow-soft rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all duration-200 group relative cursor-pointer"
                onClick={() => setActiveTab("projects")}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-red-650 font-bold uppercase tracking-wider">Biggest Risk</span>
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-750 text-[9px] font-bold uppercase border border-red-100 rounded leading-none">Critical</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-red-650 transition duration-150 leading-snug">
                    Structural Steel Delays
                  </h4>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Risk Exposure:</span>
                      <span className="text-red-650 font-black">₹18L</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Projects Impacted:</span>
                      <span className="text-slate-700 font-bold">3 Projects</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-red-650 font-bold group-hover:translate-x-0.5 transition-transform duration-150">
                  <span>Review Supply Interruption</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Segment Card */}
              <div 
                className="bg-white hover:bg-slate-50/20 border border-slate-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-soft rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all duration-200 group relative cursor-pointer"
                onClick={() => setActiveTab("sales")}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Fastest Growing</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase border border-blue-100 rounded leading-none">Growth</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition duration-150 leading-snug">
                    Luxury Residences
                  </h4>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Growth Rate:</span>
                      <span className="text-blue-600 font-black">+24% Growth</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Lead Velocity:</span>
                      <span className="text-slate-700 font-bold">Strong</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform duration-150">
                  <span>View Demand Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Bottleneck Card */}
              <div 
                className="bg-white hover:bg-slate-50/20 border border-slate-200 hover:border-amber-300 hover:-translate-y-0.5 hover:shadow-soft rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all duration-200 group relative cursor-pointer"
                onClick={() => setActiveTab("procurement")}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Largest Bottleneck</span>
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold uppercase border border-amber-100 rounded leading-none">Warning</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition duration-150 leading-snug">
                    Vendor SteelCorp
                  </h4>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Average Delay:</span>
                      <span className="text-amber-600 font-black">14 Days</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Impacted Orders:</span>
                      <span className="text-slate-700 font-bold">28 Orders</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform duration-150">
                  <span>Examine Vendor Performance</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: CORRELATION CENTER */}
      <div className="mb-8">
        <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-soft backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/60 pb-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4.5 w-4.5 text-amber-500 glow-amber" />
                <h3 className="text-md font-bold text-slate-900">Correlation Center</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Investigate cross-department cause-and-effect relationship mapping.
              </p>
            </div>
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex mt-3 md:mt-0">
              <button
                onClick={() => setSelectedCorrelationPath("supply")}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedCorrelationPath === "supply" ? "bg-white text-amber-700 border border-slate-200/60 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Supply Chain Delays
              </button>
              <button
                onClick={() => setSelectedCorrelationPath("capital")}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedCorrelationPath === "capital" ? "bg-white text-blue-700 border border-slate-200/60 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Working Capital Drag
              </button>
              <button
                onClick={() => setSelectedCorrelationPath("growth")}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  selectedCorrelationPath === "growth" ? "bg-white text-emerald-700 border border-slate-200/60 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Growth Multipliers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Node Graph Flow */}
            <div className="col-span-1 lg:col-span-7 bg-slate-50/85 rounded-xl p-6 border border-slate-200/60 flex flex-col justify-center min-h-[200px] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-6 sm:space-y-0 sm:space-x-4 relative z-10">
                {selectedCorrelationPath === "supply" && (
                  <>
                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Procurement Delays",
                      label: "SteelCorp Order Backlog",
                      details: [
                        { key: "Affected Orders", value: "PO-2026-904, PO-2026-909" },
                        { key: "Pending Quantity", value: "85 MT Structural Steel" },
                        { key: "Current Transit Delay", value: "8 Days" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <AlertTriangle className="h-6 w-6 text-amber-600 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Steel Shortage</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Procurement Bottleneck</span>
                    </div>

                    <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-amber-300 relative">
                      <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700 font-mono font-bold">
                        R: -0.82
                      </div>
                    </div>

                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Labor Optimization",
                      label: "Structural Team Underutilization",
                      details: [
                        { key: "Total Standby Masons", value: "32 Workers" },
                        { key: "Underutilization Rate", value: "34%" },
                        { key: "Weekly Financial Drag", value: "₹4.5 Lakhs" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Attendance Drop</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Workforce Drag</span>
                    </div>

                    <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-purple-300 relative">
                      <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded text-[9px] text-purple-700 font-mono font-bold">
                        R: +0.78
                      </div>
                    </div>

                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Project Schedule Impact",
                      label: "Slab Casting Schedule Breach",
                      details: [
                        { key: "Affected Milestone", value: "Smart Heights 10th Floor Slab" },
                        { key: "Original Target", value: "2026-06-25" },
                        { key: "Revised Target", value: "2026-07-13" },
                        { key: "Estimated Delay Penalty", value: "₹2.2 Lakhs/Day" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <Clock className="h-6 w-6 text-red-600 animate-bounce" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Project Delays</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Milestone Impact</span>
                    </div>
                  </>
                )}

                {selectedCorrelationPath === "capital" && (
                  <>
                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Receivables Analytics",
                      label: "Corporate Billing Milestones",
                      details: [
                        { key: "Claimed Amount Pending", value: "₹3.2 Cr" },
                        { key: "Unbilled WIP Work", value: "₹1.4 Cr" },
                        { key: "Average Invoice Processing Time", value: "48 Days" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <IndianRupee className="h-6 w-6 text-cyan-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Collections Slowing</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Finance Risk</span>
                    </div>

                    <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-cyan-300 relative">
                      <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-50 border border-cyan-200 rounded text-[9px] text-cyan-700 font-mono font-bold">
                        R: +0.76
                      </div>
                    </div>

                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Cashflow Analysis",
                      label: "Liquid Capital Constraints",
                      details: [
                        { key: "Operating Cash reserve", value: "₹82 Lakhs" },
                        { key: "Subcontractor liability", value: "₹1.2 Cr" },
                        { key: "Debt Interest variance", value: "+0.5% (annualised)" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <TrendingDown className="h-6 w-6 text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Cash Flow Pressure</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Treasury Bottleneck</span>
                    </div>

                    <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-amber-300 relative">
                      <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700 font-mono font-bold">
                        R: -0.71
                      </div>
                    </div>

                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Procurement Delays",
                      label: "Awaiting Treasury Approvals",
                      details: [
                        { key: "POs Pending Release", value: "14 Orders" },
                        { key: "Total Release Value", value: "₹1.65 Cr" },
                        { key: "Avg Holding time", value: "6.2 Days" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <AlertTriangle className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Procurement Delays</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Supply Interruption</span>
                    </div>
                  </>
                )}

                {selectedCorrelationPath === "growth" && (
                  <>
                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Sales Inflow",
                      label: "Lead Valuation Uplift",
                      details: [
                        { key: "Avg Quality Score", value: "8.2 / 10" },
                        { key: "Site Visit Interest Rate", value: "48%" },
                        { key: "Premium Sector share", value: "72% of leads" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <Sparkles className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Lead Quality Lift</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Sales Inflow</span>
                    </div>

                    <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-emerald-300 relative">
                      <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] text-emerald-700 font-mono font-bold">
                        R: +0.91
                      </div>
                    </div>

                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Pipeline Conversions",
                      label: "Broker Booking Conversions",
                      details: [
                        { key: "Average Conversion Rate", value: "11.2%" },
                        { key: "Days in Negotiation", value: "5.4 Days" },
                        { key: "Deals closed (past 30d)", value: "24 Units" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Higher Conversion</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Sales Conversion</span>
                    </div>

                    <div className="hidden sm:block flex-1 h-0.5 border-t border-dashed border-blue-300 relative">
                      <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-700 font-mono font-bold">
                        R: +0.86
                      </div>
                    </div>

                    <div className="flex flex-col items-center w-36 text-center group cursor-pointer" onClick={() => setDrillDownItem({
                      category: "Financial Revenue",
                      label: "Contract value booking speed",
                      details: [
                        { key: "Revenue Booking Run Rate", value: "₹4.2 Cr/Month" },
                        { key: "Incremental Net Profit", value: "+₹54 Lakhs" },
                        { key: "Strategic Cash reserves", value: "₹2.2 Cr" }
                      ]
                    })}>
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mt-2">Revenue Growth</span>
                      <span className="text-[9px] text-slate-500 font-semibold">Finance Result</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Explanatory Correlation Panel */}
            <div className="col-span-1 lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/60 flex-1 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    System Correlation Index
                  </span>
                  <div className="flex justify-between items-center mt-1">
                    <h4 className="text-md font-bold text-slate-900">
                      {selectedCorrelationPath === "supply" && "Supply Chain Interruption Path"}
                      {selectedCorrelationPath === "capital" && "Working Capital Constraints Path"}
                      {selectedCorrelationPath === "growth" && "Sales Growth Accelerator Path"}
                    </h4>
                    <span className="text-xs font-mono bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                      Confidence 91%
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-4 leading-relaxed font-medium">
                    {selectedCorrelationPath === "supply" && (
                      "Steel orders delayed by 8+ days at supplier Level (SteelCorp) have created standby inefficiencies. Because masons cannot cast slab structure without reinforcements, their daily attendance drop has triggered a cascade project delay of 18 days at Smart Heights."
                    )}
                    {selectedCorrelationPath === "capital" && (
                      "Collection delays on milestone claims (₹3.2 Cr) from corporate owners have tied up liquid reserves. The consequent treasury cashflow bottleneck restricts ready-capital release, forcing purchase orders (14 POs) to remain pending approval."
                    )}
                    {selectedCorrelationPath === "growth" && (
                      "Broker commissions and networks launched in Q1 have yielded a 2.3x increase in lead quality score (8.2/10). These high-quality leads show shorter negotiation timelines, directly raising monthly closed contract rates to ₹4.2 Cr."
                    )}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Info className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] text-slate-500 font-semibold">Click nodes to drill down details</span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedCorrelationPath === "supply") executeRecommendation("rec-2", "Approve pending steel PO release");
                      if (selectedCorrelationPath === "capital") executeRecommendation("rec-3", "Improve collection focus on Smart Heights");
                      if (selectedCorrelationPath === "growth") executeRecommendation("rec-1", "Scale Q3 Broker Commission Incentives");
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Mitigate Path Risk
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: INTELLIGENCE TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100/80 border border-slate-200 rounded-xl mb-6 scrollbar-hide">
        {(["sales", "projects", "finance", "workforce", "procurement"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 min-w-[150px] py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === t
                ? "bg-white text-blue-600 border border-slate-200/60 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t === "sales" && "Sales Intelligence"}
            {t === "projects" && "Project Intelligence"}
            {t === "finance" && "Finance Intelligence"}
            {t === "workforce" && "Workforce Intelligence"}
            {t === "procurement" && "Procurement Intelligence"}
          </button>
        ))}
      </div>

      {/* TABS WORKSPACE CONTENT */}
      <div className="space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tabData[activeTab].kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 flex flex-col justify-between transition group relative shadow-sm"
            >
              <div>
                <span className="text-[11px] text-slate-500 font-bold tracking-wider uppercase">
                  {kpi.label}
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{kpi.value}</span>
                  <span
                    className={`text-xs font-bold ${
                      kpi.trend.startsWith("+")
                        ? "text-emerald-600"
                        : kpi.trend === "Stable"
                        ? "text-slate-500"
                        : "text-amber-600"
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-500 font-semibold">{kpi.desc}</span>
                <Sparkline data={kpi.sparkline} color={kpi.color} />
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-0 group-hover:opacity-100 transition"
                style={{ backgroundColor: kpi.color }}
              />
            </div>
          ))}
        </div>

        {/* Dynamic Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Card 1 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative group shadow-soft">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {activeTab === "sales" && "Monthly Lead Creation Trend"}
                  {activeTab === "projects" && "Actual vs Planned Project Completion"}
                  {activeTab === "finance" && "Monthly Billing vs Collections"}
                  {activeTab === "workforce" && "Daily Attendance Rate by Trade"}
                  {activeTab === "procurement" && "Monthly Material Consumption"}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Operational trends over past 6 months
                </p>
              </div>
              <button
                onClick={() =>
                  setMaximizedChart({
                    title:
                      activeTab === "sales"
                        ? "Monthly Lead Creation Trend"
                        : activeTab === "projects"
                        ? "Actual vs Planned Project Completion"
                        : activeTab === "finance"
                        ? "Monthly Billing vs Collections"
                        : activeTab === "workforce"
                        ? "Daily Attendance Rate by Trade"
                        : "Monthly Material Consumption",
                    type:
                      activeTab === "sales"
                        ? "leadTrend"
                        : activeTab === "projects"
                        ? "projProgress"
                        : activeTab === "finance"
                        ? "revColl"
                        : activeTab === "workforce"
                        ? "workforceAttendance"
                        : "procureCons"
                  })
                }
                className="p-1.5 bg-slate-100 rounded hover:bg-slate-200 transition cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
            <div className="h-72 w-full">
              <ChartRenderer
                type={
                  activeTab === "sales"
                    ? "leadTrend"
                    : activeTab === "projects"
                    ? "projProgress"
                    : activeTab === "finance"
                    ? "revColl"
                    : activeTab === "workforce"
                    ? "workforceAttendance"
                    : "procureCons"
                }
                colors={themeColors}
              />
            </div>
          </div>

          {/* Chart Card 2 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative group shadow-soft">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {activeTab === "sales" && "Lead Source Performance Metrics"}
                  {activeTab === "projects" && "Unsold Real Estate Inventory"}
                  {activeTab === "finance" && "Outstanding Invoices Aging Analysis"}
                  {activeTab === "workforce" && "Trade Productivity Level Index"}
                  {activeTab === "procurement" && "Purchase Orders Value vs Budget"}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">Performance and allocation breakdown</p>
              </div>
              <button
                onClick={() =>
                  setMaximizedChart({
                    title:
                      activeTab === "sales"
                        ? "Lead Source Performance Metrics"
                        : activeTab === "projects"
                        ? "Unsold Real Estate Inventory"
                        : activeTab === "finance"
                        ? "Outstanding Invoices Aging Analysis"
                        : activeTab === "workforce"
                        ? "Trade Productivity Level Index"
                        : "Purchase Orders Value vs Budget",
                    type:
                      activeTab === "sales"
                        ? "sourcePerf"
                        : activeTab === "projects"
                        ? "unsoldInv"
                        : activeTab === "finance"
                        ? "aging"
                        : activeTab === "workforce"
                        ? "workforceProd"
                        : "procurePurch"
                  })
                }
                className="p-1.5 bg-slate-100 rounded hover:bg-slate-200 transition cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
            <div className="h-72 w-full">
              <ChartRenderer
                type={
                  activeTab === "sales"
                    ? "sourcePerf"
                    : activeTab === "projects"
                    ? "unsoldInv"
                    : activeTab === "finance"
                    ? "aging"
                    : activeTab === "workforce"
                    ? "workforceProd"
                    : "procurePurch"
                }
                colors={themeColors}
              />
            </div>
          </div>
        </div>

        {/* Search & Detail Table Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-sans">Audit Detail Register</h4>
              <p className="text-[10px] text-slate-500 font-semibold">
                Granular register record list relating to active {activeTab} insights.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Input
                type="text"
                placeholder={`Search ${activeTab} data...`}
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400 rounded-lg text-xs font-semibold"
              />
              <Search className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold tracking-wider uppercase text-[10px]">
                  <th className="p-4 w-10"></th>
                  {activeTab === "sales" && (
                    <>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("name")}>Opportunity Name</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("source")}>Lead Source</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("value")}>Value</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("quality")}>Quality Rating</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("stage")}>Current Stage</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("days")}>Days Active</th>
                    </>
                  )}
                  {activeTab === "projects" && (
                    <>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("name")}>Project Name</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("segment")}>Segment</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("completion")}>Completion</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("target")}>Target Completion Date</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("budgetVar")}>Budget Variance</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("risk")}>Critical Risk Level</th>
                    </>
                  )}
                  {activeTab === "finance" && (
                    <>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("customer")}>Corporate Client</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("project")}>Project Location</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("dueAmount")}>Due Amount</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("aging")}>Aging Period</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("followUp")}>Last Follow-up</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("status")}>Claims Status</th>
                    </>
                  )}
                  {activeTab === "workforce" && (
                    <>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("contractor")}>Contractor Agency</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("project")}>Project Site</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("headcount")}>Deployed Labor</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("attendance")}>Attendance Rate</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("efficiency")}>Daily Efficiency</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("primaryActivity")}>Current Tasks</th>
                    </>
                  )}
                  {activeTab === "procurement" && (
                    <>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("poNumber")}>PO Reference</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("material")}>Material Requested</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("vendor")}>Vendor Supplier</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("value")}>Invoiced Cost</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("leadTime")}>Lead Time</th>
                      <th className="p-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("delay")}>Days Delayed</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row: any) => (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => toggleRow(row.id)}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-150 cursor-pointer text-slate-800"
                    >
                      <td className="p-4 text-center">
                        {expandedRows[row.id] ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </td>
                      {activeTab === "sales" && (
                        <>
                          <td className="p-4 font-bold text-slate-900">{row.name}</td>
                          <td className="p-4 text-slate-600 font-semibold">{row.source}</td>
                          <td className="p-4 font-bold text-slate-900">{formatINR(row.value)}</td>
                          <td className="p-4 text-blue-600 font-mono font-bold">{row.quality}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.stage.includes("Negotiation") ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              row.stage.includes("Booking") ? "bg-emerald-50 text-emerald-750 border border-emerald-200" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {row.stage}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-semibold">{row.days} Days</td>
                        </>
                      )}
                      {activeTab === "projects" && (
                        <>
                          <td className="p-4 font-bold text-slate-900">{row.name}</td>
                          <td className="p-4 text-slate-600 font-semibold">{row.segment}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${row.completion}%` }} />
                              </div>
                              <span className="font-bold text-slate-800">{row.completion}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-semibold">{row.target}</td>
                          <td className="p-4 font-bold text-slate-900">{row.budgetVar}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              row.risk.includes("Critical") ? "bg-red-50 text-red-700 border border-red-200 animate-pulse" :
                              row.risk.includes("Watch") ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                              {row.risk}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === "finance" && (
                        <>
                          <td className="p-4 font-bold text-slate-900">{row.customer}</td>
                          <td className="p-4 text-slate-600 font-semibold">{row.project}</td>
                          <td className="p-4 font-bold text-slate-900">{formatINR(row.dueAmount)}</td>
                          <td className="p-4 text-slate-600 font-mono font-bold">{row.aging}</td>
                          <td className="p-4 text-slate-500 font-semibold">{row.followUp}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status.includes("Dispute") ? "bg-red-50 text-red-700 border border-red-200" :
                              row.status.includes("Milestone") ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === "workforce" && (
                        <>
                          <td className="p-4 font-bold text-slate-900">{row.contractor}</td>
                          <td className="p-4 text-slate-600 font-semibold">{row.project}</td>
                          <td className="p-4 text-slate-800 font-bold">{row.headcount} Workers</td>
                          <td className="p-4 font-bold text-slate-700">{row.attendance}</td>
                          <td className="p-4 text-emerald-600 font-mono font-bold">{row.efficiency}</td>
                          <td className="p-4 text-slate-600 font-semibold">{row.primaryActivity}</td>
                        </>
                      )}
                      {activeTab === "procurement" && (
                        <>
                          <td className="p-4 font-bold text-slate-900">{row.poNumber}</td>
                          <td className="p-4 text-slate-600 font-semibold">{row.material}</td>
                          <td className="p-4 text-slate-600 font-semibold">{row.vendor}</td>
                          <td className="p-4 font-bold text-slate-900">{formatINR(row.value)}</td>
                          <td className="p-4 text-slate-500 font-mono font-bold">{row.leadTime}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.delay.startsWith("0") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                            }`}>
                              {row.delay}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>

                    {/* Expandable row content */}
                    {expandedRows[row.id] && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={7} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-5 border-b border-slate-200/60 space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm">
                                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                                  Diagnostic Audit Log
                                </span>
                                <div className="space-y-1.5 text-[11px] text-slate-600 font-medium">
                                  <div className="flex justify-between">
                                    <span>Sync Status:</span>
                                    <span className="text-emerald-600 font-bold">Active</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Manager Signature:</span>
                                    <span className="text-slate-800">{row.manager || "Executive AI Engine"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Last Data Push:</span>
                                    <span className="text-slate-800">{new Date().toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm">
                                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                                  Cross-Functional Impact
                                </span>
                                <p className="text-[11px] text-slate-600 leading-normal font-medium">
                                  {activeTab === "sales" && "Changes in this pipeline deal immediately affect cash inflow expectations inside the Q3 collections forecast model."}
                                  {activeTab === "projects" && "Delay impacts on structural milestones correlate with sub-contractor attendance drops and steel shortages."}
                                  {activeTab === "finance" && "Outstanding receivables aging in this project are holding back PO authorizations for cement concrete shipments."}
                                  {activeTab === "workforce" && "Low trade attendance triggers milestone delay paths, driving budget variances upward due to equipment rentals."}
                                  {activeTab === "procurement" && "Delayed shipments block structural teams from commencing slab work, creating labor cost variances."}
                                </p>
                              </div>

                              <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                                    Strategic Action
                                  </span>
                                  <span className="text-[11px] text-slate-600 font-medium">
                                    Inspect raw database record or flag to project PM.
                                  </span>
                                </div>
                                <div className="flex space-x-2 mt-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDrillDownItem({
                                        category: `${activeTab.toUpperCase()} Intelligence Drill-Down`,
                                        label: row.name || row.customer || row.contractor || row.poNumber,
                                        details: [
                                          { key: "Database Identifier", value: `UID-4098-${row.id}` },
                                          { key: "System Reliability Index", value: "98.4%" },
                                          { key: "Strategic Variance Index", value: "+4.1%" }
                                        ]
                                      });
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] rounded font-bold transition cursor-pointer"
                                  >
                                    Execute Drill-down
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowExportToast("Item flagged for executive review board.");
                                      setTimeout(() => setShowExportToast(null), 3000);
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] rounded font-bold transition cursor-pointer"
                                  >
                                    Flag Row
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing {Math.min(totalRows, (currentPage - 1) * pageSize + 1)} to{" "}
              {Math.min(totalRows, currentPage * pageSize)} of {totalRows} entries
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded font-bold transition cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded font-bold transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: PREDICTIVE INSIGHTS */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Forecast */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden shadow-soft backdrop-blur-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                Next-Month Forecast
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Revenue Forecast</h4>
            </div>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-250 font-bold">
              Confidence 84%
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900">{formatCrVal(4.2)}</span>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                Confidence Band: {formatCrVal(3.8)} - {formatCrVal(4.5)}
              </p>
            </div>
            {/* Circular Forecast Gauge */}
            <div className="relative h-16 w-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600"
                  strokeDasharray="84, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-900">84%</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>Driven by broker network conversion multiplier.</span>
          </div>
        </div>

        {/* Collection Forecast */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden shadow-soft backdrop-blur-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                Next-Month Forecast
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Collection Inflow</h4>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
              Confidence 79%
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900">{formatCrVal(1.8)}</span>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                Confidence Band: {formatCrVal(1.5)} - {formatCrVal(2.1)}
              </p>
            </div>
            {/* Circular Forecast Gauge */}
            <div className="relative h-16 w-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600"
                  strokeDasharray="79, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-900">79%</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>Accounts for disputations at Smart Heights.</span>
          </div>
        </div>

        {/* Project Completion Forecast */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden shadow-soft backdrop-blur-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                Milestone Forecast
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Projected Completion</h4>
            </div>
            <span className="text-xs font-mono bg-purple-550/10 bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold">
              Confidence 87%
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900">92% On Time</span>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                Estimated delay margin: 6.5 Days
              </p>
            </div>
            {/* Circular Forecast Gauge */}
            <div className="relative h-16 w-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-600"
                  strokeDasharray="87, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-900">87%</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>Assumes cement concrete delivery schedules hold.</span>
          </div>
        </div>
      </div>

      {/* SECTION 6: AI RECOMMENDATIONS ENGINE */}
      <div className="mt-8">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="h-4.5 w-4.5 text-blue-600 glow-blue animate-pulse" />
          <h3 className="text-md font-bold text-slate-900">AI Recommendations Engine</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recommendation 1 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative flex flex-col justify-between shadow-soft backdrop-blur-md">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 uppercase">
                  Priority High
                </span>
                <span className="text-xs font-bold text-slate-500">Impact: High</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Scale Q3 Broker Commission Incentives</h4>
              <p className="text-xs text-slate-500 mt-2 leading-normal font-medium">
                Increase regional broker commission payouts by 0.5% for the upcoming Q3 project launches. Sourced leads convert at 2.3x benchmark website leads.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-600">Confidence: 89%</span>
              <button
                onClick={() => executeRecommendation("rec-1", "Scale Q3 Broker Commission Incentives")}
                disabled={approvedRecommendations["rec-1"]?.approved || approvedRecommendations["rec-1"]?.processing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wide transition disabled:bg-emerald-50 disabled:text-emerald-600 disabled:border-emerald-250 border border-transparent cursor-pointer shadow-sm"
              >
                {approvedRecommendations["rec-1"]?.processing ? "Executing..." :
                 approvedRecommendations["rec-1"]?.approved ? `Approved ${approvedRecommendations["rec-1"].date}` : "Execute Proposal"}
              </button>
            </div>
          </div>

          {/* Recommendation 2 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative flex flex-col justify-between shadow-soft backdrop-blur-md">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase">
                  Priority Med
                </span>
                <span className="text-xs font-bold text-slate-500">Impact: Medium</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Approve Pending Steel PO Release</h4>
              <p className="text-xs text-slate-500 mt-2 leading-normal font-medium">
                Release pending treasury signatures for 14 structural steel purchase orders. Resolving transit backlogs halts the current 18-day project delays cascade.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-600">Confidence: 81%</span>
              <button
                onClick={() => executeRecommendation("rec-2", "Approve Pending Steel PO Release")}
                disabled={approvedRecommendations["rec-2"]?.approved || approvedRecommendations["rec-2"]?.processing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wide transition disabled:bg-emerald-50 disabled:text-emerald-600 disabled:border-emerald-250 border border-transparent cursor-pointer shadow-sm"
              >
                {approvedRecommendations["rec-2"]?.processing ? "Executing..." :
                 approvedRecommendations["rec-2"]?.approved ? `Approved ${approvedRecommendations["rec-2"].date}` : "Execute Proposal"}
              </button>
            </div>
          </div>

          {/* Recommendation 3 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 relative flex flex-col justify-between shadow-soft backdrop-blur-md">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 uppercase">
                  Priority High
                </span>
                <span className="text-xs font-bold text-slate-500">Impact: High</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Improve Collection Focus on Smart Heights</h4>
              <p className="text-xs text-slate-500 mt-2 leading-normal font-medium">
                Deploy accounting taskforces to reconcile claims disputes with corporate tenants at Smart Heights (₹1.8 Cr). Frees liquid operating capital.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-600">Confidence: 86%</span>
              <button
                onClick={() => executeRecommendation("rec-3", "Improve Collection Focus on Smart Heights")}
                disabled={approvedRecommendations["rec-3"]?.approved || approvedRecommendations["rec-3"]?.processing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wide transition disabled:bg-emerald-50 disabled:text-emerald-600 disabled:border-emerald-250 border border-transparent cursor-pointer shadow-sm"
              >
                {approvedRecommendations["rec-3"]?.processing ? "Executing..." :
                 approvedRecommendations["rec-3"]?.approved ? `Approved ${approvedRecommendations["rec-3"].date}` : "Execute Proposal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chart Renderer Component to handle high density Recharts configurations
function ChartRenderer({
  type,
  colors,
  fullscreen = false
}: {
  type: string;
  colors: any;
  fullscreen?: boolean;
}) {
  const chartMargins = fullscreen
    ? { top: 20, right: 30, left: 30, bottom: 20 }
    : { top: 10, right: 10, left: -20, bottom: 0 };

  // 1. Sales Trends
  const salesMonthlyLeadTrend = [
    { month: "Jan", Premium: 120, Luxury: 45, Affordable: 240 },
    { month: "Feb", Premium: 140, Luxury: 50, Affordable: 210 },
    { month: "Mar", Premium: 180, Luxury: 65, Affordable: 280 },
    { month: "Apr", Premium: 220, Luxury: 80, Affordable: 310 },
    { month: "May", Premium: 250, Luxury: 95, Affordable: 290 },
    { month: "Jun", Premium: 280, Luxury: 110, Affordable: 330 }
  ];

  const salesSourcePerf = [
    { source: "Brokers", leads: 420, won: 103 },
    { source: "Website", leads: 380, won: 34 },
    { source: "Referrals", leads: 150, won: 52 },
    { source: "Walk-ins", leads: 180, won: 41 },
    { source: "Digital Ads", leads: 320, won: 48 }
  ];

  // 2. Project Trends
  const projectsCompletionData = [
    { name: "Smart Hts", Planned: 75, Actual: 72 },
    { name: "Heritage Vl", Planned: 90, Actual: 92 },
    { name: "Emerald Hub", Planned: 60, Actual: 54 },
    { name: "Horizon Twr", Planned: 45, Actual: 38 },
    { name: "Park View", Planned: 80, Actual: 80 },
    { name: "Silicon Spc", Planned: 30, Actual: 28 }
  ];

  const projectsUnsoldInv = [
    { project: "Smart Heights", units: 48, value: 9.6 },
    { project: "Heritage Villa", units: 12, value: 4.8 },
    { project: "Emerald Hub", units: 64, value: 11.2 },
    { project: "Horizon Tower", units: 92, value: 18.4 },
    { project: "Park View", units: 28, value: 5.6 }
  ];

  // 3. Finance Trends
  const financeRevColl = [
    { month: "Jan", Revenue: 2.1, Collections: 1.8 },
    { month: "Feb", Revenue: 2.4, Collections: 2.0 },
    { month: "Mar", Revenue: 3.1, Collections: 2.2 },
    { month: "Apr", Revenue: 2.8, Collections: 2.5 },
    { month: "May", Revenue: 3.5, Collections: 2.8 },
    { month: "Jun", Revenue: 4.2, Collections: 3.1 }
  ];

  const financeAging = [
    { bucket: "0-30 Days", North: 0.8, South: 0.5 },
    { bucket: "31-60 Days", North: 0.6, South: 0.7 },
    { bucket: "61-90 Days", North: 1.1, South: 0.4 },
    { bucket: "90+ Days", North: 1.4, South: 0.8 }
  ];

  // 4. Workforce Trends
  const workforceAttendance = [
    { day: "Mon", Masons: 92, Laborers: 88, Supervisors: 96 },
    { day: "Tue", Masons: 94, Laborers: 89, Supervisors: 96 },
    { day: "Wed", Masons: 88, Laborers: 85, Supervisors: 95 },
    { day: "Thu", Masons: 84, Laborers: 82, Supervisors: 94 },
    { day: "Fri", Masons: 86, Laborers: 84, Supervisors: 95 },
    { day: "Sat", Masons: 89, Laborers: 86, Supervisors: 96 }
  ];

  const workforceProd = [
    { month: "Jan", Masonry: 90, Electrical: 92, Plumbing: 88 },
    { month: "Feb", Masonry: 91, Electrical: 93, Plumbing: 89 },
    { month: "Mar", Masonry: 93, Electrical: 92, Plumbing: 90 },
    { month: "Apr", Masonry: 92, Electrical: 91, Plumbing: 92 },
    { month: "May", Masonry: 94, Electrical: 94, Plumbing: 93 },
    { month: "Jun", Masonry: 95, Electrical: 95, Plumbing: 94 }
  ];

  // 5. Procurement Trends
  const procureCons = [
    { month: "Jan", Cement: 120, Steel: 80, Bricks: 150 },
    { month: "Feb", Cement: 130, Steel: 85, Bricks: 160 },
    { month: "Mar", Cement: 145, Steel: 72, Bricks: 175 },
    { month: "Apr", Cement: 160, Steel: 65, Bricks: 190 },
    { month: "May", Cement: 150, Steel: 68, Bricks: 180 },
    { month: "Jun", Cement: 170, Steel: 78, Bricks: 200 }
  ];

  const procurePurch = [
    { month: "Jan", Actual: 2.2, Budget: 2.0 },
    { month: "Feb", Actual: 2.4, Budget: 2.5 },
    { month: "Mar", Actual: 3.1, Budget: 3.0 },
    { month: "Apr", Actual: 2.8, Budget: 2.8 },
    { month: "May", Actual: 3.5, Budget: 3.2 },
    { month: "Jun", Actual: 3.8, Budget: 3.5 }
  ];

  // Tooltip theme customization
  const customTooltip = (
    <Tooltip
      contentStyle={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "rgba(15, 23, 42, 0.08)",
        borderRadius: "8px",
        color: "#0f172a",
        fontWeight: "600",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}
    />
  );

  switch (type) {
    case "leadTrend":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesMonthlyLeadTrend} margin={chartMargins}>
            <defs>
              <linearGradient id="colorPrem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.blue} stopOpacity={0.2} />
                <stop offset="95%" stopColor={colors.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLux" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.purple} stopOpacity={0.2} />
                <stop offset="95%" stopColor={colors.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Area
              type="monotone"
              dataKey="Premium"
              stroke={colors.blue}
              fillOpacity={1}
              fill="url(#colorPrem)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Luxury"
              stroke={colors.purple}
              fillOpacity={1}
              fill="url(#colorLux)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Affordable"
              stroke={colors.slate}
              fillOpacity={0.05}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "sourcePerf":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesSourcePerf} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="source" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Bar dataKey="leads" fill={colors.blue} radius={[4, 4, 0, 0]} name="Leads Sourced" />
            <Bar dataKey="won" fill={colors.emerald} radius={[4, 4, 0, 0]} name="Deals Won" />
          </BarChart>
        </ResponsiveContainer>
      );

    case "projProgress":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={projectsCompletionData} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} label={{ value: "Completion %", angle: -90, position: "insideLeft", fill: "#64748b", style: { fontSize: "10px", fontWeight: "600" } }} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Bar dataKey="Actual" fill={colors.blue} radius={[4, 4, 0, 0]} barSize={20} />
            <Line type="monotone" dataKey="Planned" stroke={colors.amber} strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      );

    case "unsoldInv":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectsUnsoldInv} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="project" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Bar dataKey="units" fill={colors.purple} name="Unsold Units" radius={[4, 4, 0, 0]} />
            <Bar dataKey="value" fill={colors.cyan} name="Valuation (Cr)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "revColl":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={financeRevColl} margin={chartMargins}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.emerald} stopOpacity={0.2} />
                <stop offset="95%" stopColor={colors.emerald} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.cyan} stopOpacity={0.2} />
                <stop offset="95%" stopColor={colors.cyan} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} label={{ value: "₹ Crore", angle: -90, position: "insideLeft", fill: "#64748b", style: { fontSize: "10px", fontWeight: "600" } }} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Area type="monotone" dataKey="Revenue" stroke={colors.emerald} fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
            <Area type="monotone" dataKey="Collections" stroke={colors.cyan} fillOpacity={1} fill="url(#colorColl)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "aging":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={financeAging} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="bucket" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} label={{ value: "₹ Crore", angle: -90, position: "insideLeft", fill: "#64748b", style: { fontSize: "10px", fontWeight: "600" } }} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Bar dataKey="North" fill={colors.blue} stackId="a" name="North Zone Portfolio" />
            <Bar dataKey="South" fill={colors.purple} stackId="a" name="South Zone Portfolio" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "workforceAttendance":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={workforceAttendance} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="day" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} domain={[70, 100]} label={{ value: "Attendance %", angle: -90, position: "insideLeft", fill: "#64748b", style: { fontSize: "10px", fontWeight: "600" } }} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Line type="monotone" dataKey="Masons" stroke={colors.amber} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Laborers" stroke={colors.red} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Supervisors" stroke={colors.emerald} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      );

    case "workforceProd":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={workforceProd} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} domain={[80, 100]} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Area type="monotone" dataKey="Masonry" stroke={colors.blue} fillOpacity={0.1} strokeWidth={2} />
            <Area type="monotone" dataKey="Electrical" stroke={colors.purple} fillOpacity={0.1} strokeWidth={2} />
            <Area type="monotone" dataKey="Plumbing" stroke={colors.slate} fillOpacity={0.05} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "procureCons":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={procureCons} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} label={{ value: "Metric Tons", angle: -90, position: "insideLeft", fill: "#64748b", style: { fontSize: "10px", fontWeight: "600" } }} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Bar dataKey="Cement" fill={colors.blue} name="Cement (MT)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Steel" fill={colors.purple} name="Steel (MT)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Bricks" fill={colors.amber} name="Bricks (k units)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "procurePurch":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={procurePurch} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
            <YAxis stroke="#64748b" tickLine={false} label={{ value: "₹ Crore", angle: -90, position: "insideLeft", fill: "#64748b", style: { fontSize: "10px", fontWeight: "600" } }} />
            {customTooltip}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
            <Area type="monotone" dataKey="Actual" stroke={colors.amber} fillOpacity={0.1} fill={colors.amber} strokeWidth={2.5} />
            <Area type="monotone" dataKey="Budget" stroke={colors.slate} fillOpacity={0.05} fill={colors.slate} strokeWidth={1.5} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      );

    default:
      return (
        <div className="flex items-center justify-center text-slate-400 text-xs">
          Interactive Chart Not Available
        </div>
      );
  }
}
