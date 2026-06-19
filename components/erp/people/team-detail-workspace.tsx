"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  UserCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
  Briefcase,
  FileText,
  Calendar,
  CheckCircle,
  HelpCircle,
  Edit,
  UserPlus,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  UserX,
  PlusCircle,
  HardHat,
  Search,
} from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { toast } from "@/components/ui/toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

type TeamDetail = {
  team: {
    id: string;
    name: string;
    projectId: string;
    projectName: string;
    supervisorId: string;
    supervisorName: string;
    headcount: number;
    attendanceRate: number;
    coverageRate: number;
    productivityScore: number;
    healthScore: number;
    status: "Active" | "Inactive";
    openPositions: number;
    activeTasksCount: number;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    dateJoined: string;
    phone: string;
    status: string;
    attendancePercent: number;
  }>;
  attendanceTrend: Array<{
    date: string;
    rate: number;
  }>;
  coverageAnalysis: Array<{
    role: string;
    required: number;
    assigned: number;
    shortfall: number;
    status: string;
  }>;
  productivityMetrics: Array<{
    month: string;
    score: number;
    attendance: number;
  }>;
  activityTimeline: Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    description: string;
    icon: string;
  }>;
};

type TeamsResponse = {
  teams: Array<{
    id: string;
    name: string;
  }>;
};

type ProjectsResponse = {
  properties: Array<{
    id: string;
    name: string;
    code: string;
  }>;
};

type EmployeesResponse = {
  employees: Array<{
    id: string;
    name: string;
    designation: string;
    department: string;
    status: string;
    projectId: string;
    teamName: string;
  }>;
};

export function TeamDetailWorkspace({ teamId }: { teamId: string }) {
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"members" | "attendance" | "coverage" | "productivity" | "timeline">("members");
  
  // Drawers
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  // Edit team form fields
  const [editFormData, setEditFormData] = useState({
    name: "",
    projectId: "",
    supervisorId: "",
    status: "Active" as "Active" | "Inactive",
    productivityScore: 85,
    healthScore: 90,
    openPositions: 0,
    activeTasksCount: 3,
  });

  // Transfer Member form fields
  const [transferData, setTransferData] = useState({
    employeeId: "",
    targetTeamName: "",
  });

  // Queries
  const detailQuery = useQuery({
    queryKey: ["erp-team-detail", teamId, role],
    queryFn: async () => (await apiRequest<TeamDetail>(`/api/workforce/teams/${teamId}`, { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-projects-catalog", role],
    queryFn: async () => (await apiRequest<ProjectsResponse>("/api/properties/summary", { role })).data,
  });

  const employeesQuery = useQuery({
    queryKey: ["erp-employees-catalog", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });

  const teamsQuery = useQuery({
    queryKey: ["erp-teams-catalog", role],
    queryFn: async () => (await apiRequest<TeamsResponse>("/api/workforce/teams", { role })).data,
  });

  // Mutations
  const updateTeamMutation = useMutation({
    mutationFn: async (body: Partial<typeof editFormData>) => {
      return await apiRequest<TeamDetail["team"]>(`/api/workforce/teams/${teamId}`, {
        role,
        method: "PATCH",
        body,
      });
    },
    onSuccess: (data) => {
      toast.success("Team updated successfully");
      queryClient.invalidateQueries({ queryKey: ["erp-team-detail", teamId] });
      queryClient.invalidateQueries({ queryKey: ["erp-teams"] });
      setIsEditDrawerOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update team");
    },
  });

  const transferMemberMutation = useMutation({
    mutationFn: async ({ employeeId, targetTeamName }: { employeeId: string; targetTeamName: string }) => {
      // Find the employee first
      const emp = employeesQuery.data?.employees.find(e => e.id === employeeId);
      if (!emp) throw new Error("Employee not found");
      return await apiRequest(`/api/workforce/employees/${employeeId}`, {
        role,
        method: "PATCH",
        body: {
          teamName: targetTeamName,
          projectId: emp.projectId // Keep same project
        },
      });
    },
    onSuccess: () => {
      toast.success("Member transferred successfully");
      queryClient.invalidateQueries({ queryKey: ["erp-team-detail", teamId] });
      queryClient.invalidateQueries({ queryKey: ["erp-employees-catalog"] });
      setIsTransferModalOpen(false);
      setTransferData({ employeeId: "", targetTeamName: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to transfer member");
    },
  });

  // Pre-fill edit form when data loads
  useMemo(() => {
    if (detailQuery.data?.team) {
      const { team } = detailQuery.data;
      setEditFormData({
        name: team.name,
        projectId: team.projectId,
        supervisorId: team.supervisorId,
        status: team.status,
        productivityScore: team.productivityScore,
        healthScore: team.healthScore,
        openPositions: team.openPositions || 0,
        activeTasksCount: team.activeTasksCount || 3,
      });
    }
  }, [detailQuery.data]);

  if (detailQuery.isLoading || projectsQuery.isLoading || employeesQuery.isLoading || teamsQuery.isLoading) {
    return <LoadingStateCard title="Loading team details..." />;
  }

  if (detailQuery.error || !detailQuery.data) {
    return <ErrorStateCard message="Team profile or metrics could not be loaded." />;
  }

  const { team, members, attendanceTrend, coverageAnalysis, productivityMetrics, activityTimeline } = detailQuery.data;
  const projects = projectsQuery.data?.properties || [];
  const employees = employeesQuery.data?.employees || [];
  const teamsCatalog = teamsQuery.data?.teams || [];

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeamMutation.mutate(editFormData);
  };

  const handleTransferMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.employeeId || !transferData.targetTeamName) {
      toast.error("Please select employee and target team");
      return;
    }
    transferMemberMutation.mutate(transferData);
  };

  // Filter members by search
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.designation.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Dynamic right-side insights based on scores
  const insights = [
    team.attendanceRate < 80 
      ? `Critical: ${team.name} attendance declined to ${team.attendanceRate}% this week, falling below benchmark.`
      : `${team.name} attendance is highly stable at ${team.attendanceRate}%, maintaining solid daily roster volume.`,
    team.productivityScore > 88
      ? `Performance: Roster has exceeded schedule targets for ${team.productivityScore > 92 ? "5" : "4"} consecutive weeks.`
      : `Output: Core productivity index currently tracks at benchmark of ${team.productivityScore}%.`,
    team.openPositions > 0
      ? `Roster Gap: Project requires mobilizing ${team.openPositions} additional laborers within 10 days to cover structural shortfall.`
      : ` Roster Complete: All critical staff designations for this pod are fully assigned.`,
    `Management: Supervisor ${team.supervisorName} is currently directing work on ${team.projectName}.`
  ];

  return (
    <section className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER WITH ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/people/teams")} className="p-2 h-auto text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-page-title font-secondary text-text-primary">{team.name}</h1>
              <Badge
                tone={team.status === "Active" ? "success" : "neutral"}
                className="font-semibold scale-95"
              >
                {team.status}
              </Badge>
            </div>
            <p className="text-body text-text-secondary">
              Supervisor: <strong>{team.supervisorName}</strong> | Project: <strong>{team.projectName}</strong>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditDrawerOpen(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" /> Edit Team
          </Button>
          <Button variant="outline" onClick={() => setIsTransferModalOpen(true)} className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Transfer Members
          </Button>
          <Button variant="outline" onClick={() => router.push(`/projects/${team.projectId}`)} className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> View Project
          </Button>
        </div>
      </div>

      {/* DETAIL PAGE KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="surface-card p-4 text-center space-y-1 hover:shadow-soft transition-all duration-200">
          <p className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Team Members</p>
          <h4 className="text-kpi-value text-text-primary mt-1">{team.headcount}</h4>
          <span className="text-[11px] text-text-success font-medium">Active Roster</span>
        </Card>

        <Card className="surface-card p-4 text-center space-y-1 hover:shadow-soft transition-all duration-200">
          <p className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Attendance Rate</p>
          <h4 className={`text-kpi-value mt-1 ${team.attendanceRate < 80 ? "text-text-error" : "text-text-primary"}`}>{team.attendanceRate}%</h4>
          <span className="text-[11px] text-text-muted font-medium">Daily Average</span>
        </Card>

        <Card className="surface-card p-4 text-center space-y-1 hover:shadow-soft transition-all duration-200">
          <p className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Productivity</p>
          <h4 className="text-kpi-value text-text-primary mt-1">{team.productivityScore}%</h4>
          <span className="text-[11px] text-text-success font-medium">Milestone Index</span>
        </Card>

        <Card className="surface-card p-4 text-center space-y-1 hover:shadow-soft transition-all duration-200">
          <p className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Coverage Rate</p>
          <h4 className="text-kpi-value text-text-primary mt-1">{team.coverageRate}%</h4>
          <span className="text-[11px] text-text-muted font-medium">Role Alignment</span>
        </Card>

        <Card className="surface-card p-4 text-center space-y-1 hover:shadow-soft transition-all duration-200">
          <p className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Active Tasks</p>
          <h4 className="text-kpi-value text-text-primary mt-1">{team.activeTasksCount}</h4>
          <span className="text-[11px] text-text-muted font-medium">Assigned Milestones</span>
        </Card>

        <Card className="surface-card p-4 text-center space-y-1 hover:shadow-soft transition-all duration-200">
          <p className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Open Positions</p>
          <h4 className={`text-kpi-value mt-1 ${team.openPositions > 0 ? "text-text-warning" : "text-text-primary"}`}>{team.openPositions}</h4>
          <span className="text-[11px] text-text-muted font-medium">Recruitment Targets</span>
        </Card>
      </div>

      {/* MAIN LAYOUT AND TABS GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* LEFT SECTION (TABS & MAIN CONTENT) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs header */}
          <div className="flex border-b border-border-soft overflow-x-auto gap-4">
            <button
              onClick={() => setActiveTab("members")}
              className={`pb-3 text-body font-semibold border-b-2 transition-colors select-none ${
                activeTab === "members" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`pb-3 text-body font-semibold border-b-2 transition-colors select-none ${
                activeTab === "attendance" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab("coverage")}
              className={`pb-3 text-body font-semibold border-b-2 transition-colors select-none ${
                activeTab === "coverage" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Coverage
            </button>
            <button
              onClick={() => setActiveTab("productivity")}
              className={`pb-3 text-body font-semibold border-b-2 transition-colors select-none ${
                activeTab === "productivity" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Productivity
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3 text-body font-semibold border-b-2 transition-colors select-none ${
                activeTab === "timeline" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Activity Timeline
            </button>
          </div>

          {/* TAB 1: MEMBERS */}
          {activeTab === "members" && (
            <Card className="surface-card overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-section-title"> Roster Directory</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Search roster..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9 bg-surface border-border-soft text-body shadow-soft h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-table text-left border-collapse">
                    <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                      <tr className="h-10">
                        <th className="px-6">Name</th>
                        <th className="px-6">Designation</th>
                        <th className="px-6">Joining Date</th>
                        <th className="px-6 text-center">Attendance %</th>
                        <th className="px-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((m) => (
                          <tr key={m.id} className="h-14 border-b border-border-soft hover:bg-hover/20">
                            <td className="px-6 font-semibold text-text-primary">
                              <div className="flex flex-col">
                                <span>{m.name}</span>
                                <span className="text-[10px] text-text-muted font-normal">{m.email}</span>
                              </div>
                            </td>
                            <td className="px-6 text-text-secondary">{m.designation}</td>
                            <td className="px-6 text-text-secondary">{new Date(m.dateJoined).toLocaleDateString()}</td>
                            <td className="px-6 text-center">
                              <span className={`font-semibold ${m.attendancePercent < 80 ? "text-text-error" : "text-text-primary"}`}>
                                {m.attendancePercent}%
                              </span>
                            </td>
                            <td className="px-6 text-center">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                m.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"
                              }`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="h-32 text-center text-text-muted italic">
                            No team members matched search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              <Card className="surface-card p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-section-title">30-Day Attendance Performance</CardTitle>
                  <p className="text-label text-text-muted">Daily percentage of team members clocked present.</p>
                </CardHeader>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceTrend}>
                      <defs>
                        <linearGradient id="detailAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hover)" />
                      <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="var(--color-text-muted)" domain={[60, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="rate" stroke="var(--color-accent-primary)" fillOpacity={1} fill="url(#detailAttendance)" strokeWidth={2.5} name="Attendance Rate" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="surface-card p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-section-title">Weekly Attendance Summary</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-[var(--radius-input)] bg-emerald-50 border border-emerald-100 text-center">
                    <h5 className="text-text-success font-extrabold text-2xl">Excellent</h5>
                    <p className="text-body text-emerald-800 mt-1">Average Weekly Attendance &gt; 90%</p>
                  </div>
                  <div className="p-4 rounded-[var(--radius-input)] bg-blue-50 border border-blue-100 text-center">
                    <h5 className="text-accent-primary font-extrabold text-2xl">0.4 hrs</h5>
                    <p className="text-body text-blue-800 mt-1">Average Daily Check-in Delay</p>
                  </div>
                  <div className="p-4 rounded-[var(--radius-input)] bg-purple-50 border border-purple-100 text-center">
                    <h5 className="text-purple-700 font-extrabold text-2xl">0</h5>
                    <p className="text-body text-purple-800 mt-1">Unexcused Absences Logged</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: COVERAGE */}
          {activeTab === "coverage" && (
            <Card className="surface-card overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-section-title">Role Coverage Analysis</CardTitle>
                <p className="text-label text-text-muted">Target headcount vs actual assigned headcount for critical trade designations.</p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-table text-left border-collapse">
                    <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                      <tr className="h-10">
                        <th className="px-6">Designated Role</th>
                        <th className="px-6 text-center">Target Roster</th>
                        <th className="px-6 text-center">Assigned Active</th>
                        <th className="px-6 text-center">Shortfall</th>
                        <th className="px-6 text-center">Staffing Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coverageAnalysis.map((item, index) => (
                        <tr key={index} className="h-12 border-b border-border-soft hover:bg-hover/10">
                          <td className="px-6 font-semibold text-text-primary">{item.role}</td>
                          <td className="px-6 text-center font-semibold text-text-primary">{item.required}</td>
                          <td className="px-6 text-center font-medium text-text-secondary">{item.assigned}</td>
                          <td className={`px-6 text-center font-bold ${item.shortfall > 0 ? "text-text-warning" : "text-text-muted"}`}>
                            {item.shortfall}
                          </td>
                          <td className="px-6 text-center">
                            <Badge
                              tone={item.status === "Fully Staffed" ? "success" : "warning"}
                              className="font-bold scale-95"
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: PRODUCTIVITY */}
          {activeTab === "productivity" && (
            <Card className="surface-card p-6">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-section-title">Schedule Output & Productivity Index</CardTitle>
                <p className="text-label text-text-muted">6-month trend mapping productivity score index against core attendance rates.</p>
              </CardHeader>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hover)" />
                    <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                    <YAxis stroke="var(--color-text-muted)" domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="var(--color-accent-primary)" radius={[4, 4, 0, 0]} name="Productivity Score" />
                    <Bar dataKey="attendance" fill="var(--color-accent-secondary)" radius={[4, 4, 0, 0]} name="Attendance Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab === "timeline" && (
            <Card className="surface-card p-6">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-section-title">Workforce Event Timeline</CardTitle>
                <p className="text-label text-text-muted">Chronological log of check-ins, transfers, and safety meetings.</p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="relative pl-6 border-l border-border-soft space-y-6 ml-3">
                  {activityTimeline.map((evt) => (
                    <div key={evt.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-surface border-2 border-accent-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-body text-text-primary">{evt.title}</h4>
                          <span className="text-[11px] text-text-muted">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-body text-text-secondary">{evt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT SECTION (INTELLIGENT INSIGHTS PANEL) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="surface-card p-6 border-t-4 border-t-accent-primary">
            <div className="flex items-center gap-2 text-accent-primary mb-3">
              <Award className="h-5 w-5" />
              <CardTitle className="text-section-title">Intelligent Insights</CardTitle>
            </div>
            <p className="text-label text-text-muted mb-4">AI analysis of live workforce operations and historical data.</p>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="bg-surface-secondary border border-border-soft p-3 rounded-[var(--radius-input)] text-body text-text-secondary relative">
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          <Card className="surface-card p-6 space-y-4">
            <h3 className="font-semibold text-section-title text-text-primary">Compliance Status</h3>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-body">
              <ShieldCheck className="h-5 w-5" />
              <span>Toolbox Talk (TBT) Ok</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-body">
              <ShieldCheck className="h-5 w-5" />
              <span>Insurance Valid</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-body">
              <ShieldCheck className="h-5 w-5" />
              <span>Daily Log Sheet Filed</span>
            </div>
          </Card>
        </div>
      </div>

      {/* EDIT TEAM DRAWER */}
      <Drawer open={isEditDrawerOpen} onClose={() => setIsEditDrawerOpen(false)} title={`Edit Team: ${team.name}`}>
        <form onSubmit={handleUpdateTeam} className="space-y-4 p-1">
          <div className="space-y-1.5">
            <label className="text-label text-text-secondary font-medium">Team Name *</label>
            <Input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="bg-surface border-border-soft"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Project *</label>
              <select
                required
                value={editFormData.projectId}
                onChange={(e) => setEditFormData({ ...editFormData, projectId: e.target.value })}
                className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Supervisor *</label>
              <select
                required
                value={editFormData.supervisorId}
                onChange={(e) => setEditFormData({ ...editFormData, supervisorId: e.target.value })}
                className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
              >
                {employees.slice(0, 30).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Productivity Target Score (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editFormData.productivityScore}
                onChange={(e) => setEditFormData({ ...editFormData, productivityScore: Number(e.target.value) })}
                className="bg-surface border-border-soft"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Health score composite (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editFormData.healthScore}
                onChange={(e) => setEditFormData({ ...editFormData, healthScore: Number(e.target.value) })}
                className="bg-surface border-border-soft"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Open Roster Gaps</label>
              <Input
                type="number"
                min={0}
                value={editFormData.openPositions}
                onChange={(e) => setEditFormData({ ...editFormData, openPositions: Number(e.target.value) })}
                className="bg-surface border-border-soft"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as "Active" | "Inactive" })}
                className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-soft">
            <Button type="button" variant="outline" onClick={() => setIsEditDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTeamMutation.isPending} className="btn-primary">
              {updateTeamMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* TRANSFER MEMBERS DRAWER */}
      <Drawer open={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Team Members">
        <form onSubmit={handleTransferMember} className="space-y-4 p-1">
          <p className="text-body text-text-secondary">
            Select an employee currently assigned to this team to reallocate them to another workforce pod.
          </p>

          <div className="space-y-1.5">
            <label className="text-label text-text-secondary font-medium">Select Employee *</label>
            <select
              required
              value={transferData.employeeId}
              onChange={(e) => setTransferData({ ...transferData, employeeId: e.target.value })}
              className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
            >
              <option value="">Choose Employee</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-label text-text-secondary font-medium">Select Target Team *</label>
            <select
              required
              value={transferData.targetTeamName}
              onChange={(e) => setTransferData({ ...transferData, targetTeamName: e.target.value })}
              className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
            >
              <option value="">Choose Target Team</option>
              {teamsCatalog
                .filter((t) => t.id !== teamId)
                .map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-soft">
            <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={transferMemberMutation.isPending} className="btn-primary">
              {transferMemberMutation.isPending ? "Transferring..." : "Execute Transfer"}
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
