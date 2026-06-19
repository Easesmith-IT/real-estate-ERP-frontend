"use client";
import { toast } from "@/components/ui/toast";

import { useState } from "react";
import { Send, UserCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PendingEmployee = {
  id: string;
  name: string;
  department: string;
  designation: string;
  projectName: string;
  projectLocation?: string;
};

type PendingCheckinsProps = {
  pendingList: PendingEmployee[];
  isLoading: boolean;
};

export function AttendancePendingCheckins({ pendingList, isLoading }: PendingCheckinsProps) {
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSendReminder = (employeeId: string, employeeName: string) => {
    setSendingId(employeeId);
    setTimeout(() => {
      setSendingId(null);
      setRemindedIds((prev) => {
        const next = new Set(prev);
        next.add(employeeId);
        return next;
      });
      toast.success(`Attendance reminder notification dispatched to ${employeeName}.`);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border-soft/60 shimmer-skeleton">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-hover" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-hover" />
                <div className="h-3.5 w-24 rounded bg-hover opacity-70" />
              </div>
            </div>
            <div className="h-9 w-24 rounded bg-hover" />
          </div>
        ))}
      </div>
    );
  }

  if (pendingList.length === 0) {
    return (
      <div className="py-12 text-center text-text-muted flex flex-col items-center justify-center gap-3">
        <UserCheck className="h-12 w-12 text-success bg-success/10 p-2 rounded-full" />
        <p className="font-semibold text-text-primary text-lg">All staff accounted for</p>
        <p className="text-body max-w-sm">Today&apos;s workforce check-ins are 100% complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center gap-2 text-warning bg-warning/5 border border-warning/20 p-4 rounded-[var(--radius-input)]">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold text-text-primary">Today&apos;s Operational Alert</p>
          <p className="text-body text-text-secondary text-xs mt-0.5">
            {pendingList.length} active workforce personnel have not checked in for their scheduled shift today.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-input)] border border-border-soft bg-surface">
        <table className="w-full text-table min-w-[650px]">
          <thead className="bg-surface-secondary text-text-secondary">
            <tr className="h-12 border-b border-border-soft">
              <th className="px-6 text-left font-semibold">Employee</th>
              <th className="px-4 text-left font-semibold">Department</th>
              <th className="px-6 text-left font-semibold">Allocated Project Site</th>
              <th className="px-6 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {pendingList.map((emp) => {
              const initials = emp.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              const isReminded = remindedIds.has(emp.id);

              return (
                <tr key={emp.id} className="hover:bg-hover/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hover text-label font-semibold text-text-primary">
                        {initials}
                      </div>
                      <div>
                        <p className="text-body font-semibold text-text-primary">{emp.name}</p>
                        <p className="text-label text-text-muted">{emp.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-text-primary text-body">
                    {emp.department}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body font-semibold text-text-primary">{emp.projectName}</p>
                    <p className="text-label text-text-muted">{emp.projectLocation || "Main Campus Site"}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      size="sm"
                      variant={isReminded ? "secondary" : "outline"}
                      className="h-8 px-3 text-xs"
                      disabled={isReminded}
                      loading={sendingId === emp.id}
                      onClick={() => handleSendReminder(emp.id, emp.name)}
                    >
                      {isReminded ? "Reminded" : (
                        <>
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Send Reminder
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

