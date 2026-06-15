"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CalendarCheck2,
  Download,
  Funnel,
  Import,
  Layers3,
  Plus,
  Search,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import type { AttendanceResponse, Employee, EmployeesResponse, PropertySummaryResponse } from "@/lib/erp-types";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, toneForStatus } from "@/lib/erp-utils";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard } from "@/components/erp/live-state";
import { EnterprisePageLoader } from "@/components/ui/loaders";
import {
  EmployeeForm,
  buildEmployeeFormValues,
  createEmptyEmployeeFormValues,
  employeeStatusOptions,
  selectClassName,
  type EmployeeFormErrors,
  validateEmployeeForm,
} from "@/components/erp/employees/employee-form";
import { EmployeeInsights, type WorkforceInsight } from "@/components/erp/employees/employee-insights";
import { EmployeeKpiCards } from "@/components/erp/employees/employee-kpi-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

const rowsPerPageOptions = [20, 50, 100];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-active-soft text-body font-semibold text-accent-primary">
      {initials}
    </div>
  );
}

function buildSparklineSeed(value: number) {
  return [value - 18, value - 11, value - 7, value - 3, value - 1, value].map((point) =>
    Math.max(18, Math.min(100, point)),
  );
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

function downloadCsv(employees: Employee[]) {
  const rows = [
    [
      "Name",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Position",
      "Project",
      "Team",
      "AttendancePercent",
      "DateJoined",
      "Status",
    ],
    ...employees.map((employee) => [
      employee.name,
      employee.email,
      employee.phone,
      employee.department,
      employee.designation,
      employee.position,
      employee.projectName,
      employee.teamName,
      `${employee.attendancePercent}`,
      employee.dateJoined,
      employee.status,
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
  anchor.download = "workforce-export.csv";
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

  const headers = parseRow(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    return headers.reduce<Record<string, string>>((result, header, index) => {
      result[header] = values[index] || "";
      return result;
    }, {});
  });
}

export function EmployeeList() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const employeesQuery = useQuery({
    queryKey: ["erp-employees", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });
  const attendanceQuery = useQuery({
    queryKey: ["erp-attendance", role],
    queryFn: async () => (await apiRequest<AttendanceResponse>("/api/workforce/attendance", { role })).data,
  });
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(createEmptyEmployeeFormValues());
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(
        editingEmployeeId ? `/api/workforce/employees/${editingEmployeeId}` : "/api/workforce/employees",
        {
          role,
          method: editingEmployeeId ? "PATCH" : "POST",
          body: {
            ...formValues,
            dateJoined: formValues.dateJoined,
          },
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-employees"] });
      setDrawerOpen(false);
      setEditingEmployeeId(null);
      setFormValues(createEmptyEmployeeFormValues());
      setFormErrors({});
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (employeeId: string) =>
      apiRequest(`/api/workforce/employees/${employeeId}`, {
        role,
        method: "PATCH",
        body: { status: "Inactive" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-employees"] });
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusFilter, departmentFilter, projectFilter, teamFilter, rowsPerPage]);

  if (employeesQuery.isLoading || attendanceQuery.isLoading || projectsQuery.isLoading) {
    return <EnterprisePageLoader title="Workforce Operations" variant="table" />;
  }

  if (employeesQuery.error || attendanceQuery.error || projectsQuery.error || !employeesQuery.data || !attendanceQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Workforce operations data is unavailable." />;
  }

  const employees = employeesQuery.data.employees;
  const departments = Array.from(new Set(employees.map((employee) => employee.department))).sort();
  const teams = Array.from(new Set(employees.map((employee) => employee.teamName))).sort();
  const searchNeedle = searchValue.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      !searchNeedle ||
      employee.name.toLowerCase().includes(searchNeedle) ||
      employee.email.toLowerCase().includes(searchNeedle) ||
      employee.phone.toLowerCase().includes(searchNeedle) ||
      employee.projectName.toLowerCase().includes(searchNeedle) ||
      employee.position.toLowerCase().includes(searchNeedle);
    const matchesStatus = statusFilter === "All" || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === "All" || employee.department === departmentFilter;
    const matchesProject = projectFilter === "All" || employee.projectId === projectFilter;
    const matchesTeam = teamFilter === "All" || employee.teamName === teamFilter;
    return matchesSearch && matchesStatus && matchesDepartment && matchesProject && matchesTeam;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);
  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages);

  const totalWorkforce = employees.length;
  const presentToday = attendanceQuery.data.summary.present;
  const activeTeams = new Set(employees.filter((employee) => employee.status === "Active").map((employee) => employee.teamName)).size;
  const staffedProjects = new Set(employees.filter((employee) => employee.status !== "Inactive").map((employee) => employee.projectId)).size;
  const newJoiners = employees.filter(
    (employee) => Date.now() - new Date(employee.dateJoined).getTime() <= 30 * 24 * 60 * 60 * 1000,
  ).length;
  const averageUtilization = employees.length
    ? Math.round(
        employees.reduce((sum, employee) => sum + Number(employee.utilizationPercent || 0), 0) / employees.length,
      )
    : 0;
  const attendanceHealth = totalWorkforce ? Math.round((presentToday / totalWorkforce) * 100) : 0;
  const teamLoad = Array.from(new Set(employees.map((employee) => employee.teamName))).map((teamName) => {
    const teamEmployees = employees.filter((employee) => employee.teamName === teamName);
    const capacity = teamEmployees.length
      ? Math.round(
          teamEmployees.reduce((sum, employee) => sum + Number(employee.utilizationPercent || 0), 0) /
            teamEmployees.length,
        )
      : 0;
    return { teamName, capacity };
  });
  const highestCapacityTeam = teamLoad.sort((left, right) => right.capacity - left.capacity)[0];
  const projectCoverage = projectsQuery.data.projects.map((project) => {
    const allocated = employees.filter((employee) => employee.projectId === project.id && employee.status !== "Inactive").length;
    const target = Math.max(12, Math.round(project.totalUnits / 6));
    return {
      project,
      allocated,
      target,
      gap: Math.max(0, target - allocated),
    };
  });
  const largestGapProject = projectCoverage.sort((left, right) => right.gap - left.gap)[0];

  const kpis = [
    {
      label: "Total Workforce",
      value: `${totalWorkforce}`,
      trend: `${employeesQuery.data.meta?.active || employees.filter((employee) => employee.status === "Active").length} active records in the current operating roster`,
      status: `+${newJoiners} new`,
      tone: "info" as const,
      icon: Users,
      sparkline: buildSparklineSeed(totalWorkforce > 99 ? 88 : 70 + Math.min(totalWorkforce, 24)),
    },
    {
      label: "Present Today",
      value: `${presentToday}`,
      trend: `${attendanceHealth}% attendance coverage across staffed projects`,
      status: `${attendanceHealth}% health`,
      tone: attendanceHealth >= 90 ? ("success" as const) : ("warning" as const),
      icon: CalendarCheck2,
      sparkline: buildSparklineSeed(attendanceHealth),
    },
    {
      label: "Projects Staffed",
      value: `${staffedProjects}`,
      trend: "Live staffing across active sites and support functions",
      status: `${staffedProjects} live`,
      tone: "info" as const,
      icon: Layers3,
      sparkline: buildSparklineSeed(82),
    },
    {
      label: "Active Teams",
      value: `${activeTeams}`,
      trend: "Named workforce pods with live project ownership",
      status: `${activeTeams} teams`,
      tone: "success" as const,
      icon: BriefcaseBusiness,
      sparkline: buildSparklineSeed(76),
    },
    {
      label: "New Joiners",
      value: `${newJoiners}`,
      trend: "Employees onboarded in the last 30 days",
      status: `${newJoiners} joined`,
      tone: newJoiners > 0 ? ("success" as const) : ("neutral" as const),
      icon: UserPlus,
      sparkline: buildSparklineSeed(Math.max(30, newJoiners * 6)),
    },
    {
      label: "Workforce Utilization",
      value: `${averageUtilization}%`,
      trend: averageUtilization >= 90 ? "Optimal allocation across active teams" : "Capacity available for reassignment",
      status: averageUtilization >= 90 ? "Optimal" : "Watch",
      tone: averageUtilization >= 90 ? ("success" as const) : ("warning" as const),
      icon: Zap,
      sparkline: buildSparklineSeed(averageUtilization),
    },
  ];

  const insights: WorkforceInsight[] = [
    {
      id: "stable",
      priority: attendanceHealth >= 92 ? "Success" : "Information",
      title: "Workforce Stable",
      description: `${attendanceHealth}% attendance coverage across all active workforce records this cycle.`,
      action: "Review attendance intelligence",
      icon: "success",
    },
    {
      id: "staffing-alert",
      priority: largestGapProject?.gap ? "Critical" : "Information",
      title: "Staffing Alert",
      description: largestGapProject?.gap
        ? `${largestGapProject.project.name} requires ${largestGapProject.gap} additional workers to meet its current staffing target.`
        : "No major staffing gaps were detected across active projects.",
      action: "Inspect project staffing",
      icon: largestGapProject?.gap ? "critical" : "info",
    },
    {
      id: "capacity",
      priority: highestCapacityTeam?.capacity && highestCapacityTeam.capacity >= 96 ? "Warning" : "Information",
      title: "Team Capacity",
      description: highestCapacityTeam
        ? `${highestCapacityTeam.teamName} is operating at ${highestCapacityTeam.capacity}% capacity and should be monitored for reallocation pressure.`
        : "Team capacity data is still stabilizing.",
      action: "Open team allocation",
      icon: "warning",
    },
    {
      id: "hiring",
      priority: newJoiners > 0 ? "Information" : "Warning",
      title: "Hiring Trend",
      description: `${newJoiners} employees joined during the last 30 days, expanding current workforce strength.`,
      action: "Review onboarding cohort",
      icon: "info",
    },
  ];

  const activeFilters = [
    searchValue ? `Search: ${searchValue}` : null,
    statusFilter !== "All" ? `Status: ${statusFilter}` : null,
    departmentFilter !== "All" ? `Department: ${departmentFilter}` : null,
    projectFilter !== "All"
      ? `Project: ${projectsQuery.data.projects.find((project) => project.id === projectFilter)?.name || projectFilter}`
      : null,
    teamFilter !== "All" ? `Team: ${teamFilter}` : null,
  ].filter(Boolean) as string[];

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditingEmployeeId(null);
    setFormValues({
      ...createEmptyEmployeeFormValues(),
      projectId: projectsQuery.data.projects[0]?.id || "",
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (employee: Employee) => {
    setDrawerMode("edit");
    setEditingEmployeeId(employee.id);
    setFormValues(buildEmployeeFormValues(employee));
    setFormErrors({});
    setDrawerOpen(true);
  };

  const resetFilters = () => {
    setSearchValue("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setProjectFilter("All");
    setTeamFilter("All");
  };

  const handleSubmit = () => {
    const errors = validateEmployeeForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    saveMutation.mutate();
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setImportMessage(null);
    try {
      const content = await file.text();
      const rows = parseCsv(content);
      if (!rows.length) {
        setImportMessage("No import rows were found in the selected file.");
        return;
      }

      let imported = 0;
      for (const row of rows) {
        const projectMatch = projectsQuery.data.projects.find(
          (project) =>
            project.id === row.projectid ||
            project.name.toLowerCase() === (row.project || row.projectname || "").toLowerCase(),
        );
        if (!projectMatch) continue;

        await apiRequest("/api/workforce/employees", {
          role,
          method: "POST",
          body: {
            name: row.name || row.employee || row.employeename || "",
            email: row.email || `${(row.name || "employee").toLowerCase().replace(/\s+/g, ".")}@nimbuserp.local`,
            phone: row.phone || row.mobile || "+91 9800000000",
            department: row.department || "Projects",
            designation: row.designation || row.role || "Workforce Executive",
            position: row.position || row.designation || row.role || "Workforce Executive",
            projectId: projectMatch.id,
            teamName: row.team || row.teamname || `${projectMatch.code} Workforce Team`,
            status: row.status || "Active",
            dateJoined: row.datejoined || row.joined || new Date().toISOString().slice(0, 10),
            emergencyContact: row.emergencycontact || "Pending contact update",
            address: row.address || "Address pending import mapping",
          },
        });
        imported += 1;
      }

      await queryClient.invalidateQueries({ queryKey: ["erp-employees"] });
      setImportMessage(imported ? `Imported ${imported} employees from ${file.name}.` : `No matching projects were found in ${file.name}.`);
    } catch {
      setImportMessage(`Import failed for ${file.name}. Validate the CSV headers and try again.`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-border-soft/80 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))]">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">Workforce Intelligence Center</Badge>
              <Badge tone="success">{staffedProjects} staffed projects live</Badge>
              <Badge tone={attendanceHealth >= 92 ? "success" : "warning"}>{attendanceHealth}% attendance health</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-page-title font-secondary text-text-primary">Workforce Operations</h1>
              <p className="max-w-3xl text-body text-text-secondary">
                Manage workforce allocation, attendance health, staffing utilization, project assignments, and employee records across all active projects.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{totalWorkforce} total workforce strength</Badge>
              <Badge tone="neutral">{averageUtilization}% utilization</Badge>
              <Badge tone="neutral">{activeTeams} active teams</Badge>
              {importMessage ? <Badge tone="info">{importMessage}</Badge> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => downloadCsv(filteredEmployees)}>
              <Download className="h-4 w-4" />
              Export Workforce
            </Button>
            <Button variant="secondary" onClick={() => importInputRef.current?.click()} loading={isImporting}>
              <Import className="h-4 w-4" />
              Import Employees
            </Button>
            <Button onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmployeeKpiCards items={kpis} />

      <EmployeeInsights items={insights} />

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 border-b border-border-soft lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Employee Directory</CardTitle>
            <p className="mt-1 text-body text-text-secondary">
              Search, segment, and review workforce records without losing operational context.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => downloadCsv(filteredEmployees)}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="border-b border-border-soft bg-surface-secondary/70 px-4 py-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_repeat(4,minmax(0,0.9fr))]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search employee, email, phone, project, or role"
                  className="pl-9"
                />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClassName}>
                <option value="All">All Statuses</option>
                {employeeStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className={selectClassName}>
                <option value="All">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={selectClassName}>
                <option value="All">All Projects</option>
                {projectsQuery.data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className={selectClassName}>
                <option value="All">All Teams</option>
                {teams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{`${filteredEmployees.length} of ${employees.length} employees`}</Badge>
                {activeFilters.map((filter) => (
                  <Badge key={filter} tone="info">
                    {filter}
                  </Badge>
                ))}
                {activeFilters.length ? (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <Funnel className="h-4 w-4" />
                    Reset Filters
                  </Button>
                ) : null}
              </div>
              <p className="text-label text-text-muted">
                Showing {filteredEmployees.length ? startIndex + 1 : 0}-{Math.min(startIndex + rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
              </p>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[1280px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left font-medium">Employee</th>
                  <th className="px-4 text-left font-medium">Department</th>
                  <th className="px-4 text-left font-medium">Position</th>
                  <th className="px-4 text-left font-medium">Project</th>
                  <th className="px-4 text-left font-medium">Team</th>
                  <th className="px-4 text-left font-medium">Attendance</th>
                  <th className="px-4 text-left font-medium">Joined</th>
                  <th className="px-4 text-left font-medium">Status</th>
                  <th className="px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length ? (
                  paginatedEmployees.map((employee) => (
                    <tr key={employee.id} className="border-t border-border-soft hover:bg-hover/30">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={employee.name} />
                          <div className="space-y-1">
                            <Link href={`/people/employees/${employee.id}`} className="font-medium text-text-primary hover:text-accent-primary">
                              {employee.name}
                            </Link>
                            <p className="text-label text-text-muted">{employee.email}</p>
                            <p className="text-label text-text-muted">{employee.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{employee.department}</td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-text-primary">{employee.position}</p>
                          <p className="text-label text-text-muted">{employee.designation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-text-primary">{employee.projectName}</p>
                          <p className="text-label text-text-muted">{employee.projectRole}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-text-primary">{employee.teamName}</p>
                          <p className="text-label text-text-muted">{employee.reportingManager}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-card-title text-text-primary">{employee.attendancePercent}%</span>
                            <span className="text-label text-text-muted">{employee.attendanceMonthLabel}</span>
                          </div>
                          <div className="h-2 w-28 rounded-full bg-hover">
                            <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${employee.attendancePercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-text-primary">{formatDate(employee.dateJoined)}</p>
                          <p className="text-label text-text-muted">{employee.yearsOfService} years service</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={toneForStatus(employee.status)}>{employee.status}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/people/employees/${employee.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => openEditDrawer(employee)}>
                            Edit
                          </Button>
                          {employee.status !== "Inactive" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={deactivateMutation.isPending}
                              onClick={() => deactivateMutation.mutate(employee.id)}
                            >
                              Deactivate
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10">
                      <div className="rounded-[var(--radius-card)] border border-dashed border-border-soft bg-surface-secondary px-5 py-8 text-center">
                        <p className="text-card-title text-text-primary">No employees match the current view</p>
                        <p className="mt-2 text-body text-text-secondary">
                          Adjust the filters or search query to widen the workforce directory scope.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border-soft px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-body text-text-secondary">
              Showing {filteredEmployees.length ? startIndex + 1 : 0}-{Math.min(startIndex + rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))} className={selectClassName}>
                {rowsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} rows
                  </option>
                ))}
              </select>
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>
                Previous
              </Button>
              {pageNumbers.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === safeCurrentPage ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === "create" ? "Add Employee" : "Edit Employee"}
        size="lg"
      >
        <EmployeeForm
          mode={drawerMode}
          values={formValues}
          errors={formErrors}
          departments={departments}
          teamOptions={teams}
          projects={projectsQuery.data.projects}
          isSubmitting={saveMutation.isPending}
          onCancel={() => setDrawerOpen(false)}
          onChange={(field, value) => setFormValues((current) => ({ ...current, [field]: value }))}
          onSubmit={handleSubmit}
        />
      </Drawer>

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await handleImport(file);
          }
          event.target.value = "";
        }}
      />
    </section>
  );
}
