"use client";

import type { ProjectTask } from "@/lib/erp-types";

export const milestoneCategories = ["RERA", "Structural", "Finishing", "Approval", "Handover"] as const;
export const milestonePriorities = ["High", "Medium", "Low"] as const;

export const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export const textareaClassName =
  "min-h-[112px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
  indigo: "#4f46e5",
};

export type MilestoneComment = {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
};

export type MilestoneDocument = {
  id: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
};

export type MilestoneTimelineEntry = {
  id: string;
  eventType: string;
  title: string;
  detail: string;
  timestamp: string;
  actorName: string;
};

export type MilestoneHistoryEntry = {
  timestamp: string;
  actorName: string;
  change: string;
};

export type MilestoneTask = ProjectTask & {
  description?: string;
  startDate?: string;
  dependencies?: string;
  notes?: string;
  comments?: MilestoneComment[];
  documents?: MilestoneDocument[];
  activityTimeline?: MilestoneTimelineEntry[];
  history?: MilestoneHistoryEntry[];
};

export function daysUntil(date: string) {
  const target = new Date(date).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function getMilestoneCategory(task: MilestoneTask): string {
  const discipline = (task.discipline || "").trim();
  if (milestoneCategories.includes(discipline as (typeof milestoneCategories)[number])) {
    return discipline;
  }

  const normalized = `${task.title} ${task.description || ""} ${task.notes || ""}`.toLowerCase();
  if (normalized.includes("rera") || normalized.includes("compliance") || normalized.includes("noc")) return "RERA";
  if (normalized.includes("handover") || normalized.includes("possession")) return "Handover";
  if (normalized.includes("finish") || normalized.includes("interior") || normalized.includes("facade")) return "Finishing";
  if (normalized.includes("approval") || normalized.includes("sign-off") || normalized.includes("review")) return "Approval";
  return "Structural";
}

export function getMilestoneStatus(task: MilestoneTask) {
  if (task.status === "Done") return "Completed";
  if (task.status === "Review") return "Review";
  if (task.status === "In Progress") {
    return daysUntil(task.dueDate) < 0 ? "Delayed" : "In Progress";
  }
  if (task.status === "Planned") {
    return daysUntil(task.dueDate) < 0 ? "Delayed" : "Planned";
  }
  return daysUntil(task.dueDate) < 0 ? "Delayed" : task.status;
}

export function getRiskLevel(task: MilestoneTask) {
  const remainingDays = daysUntil(task.dueDate);
  const dependencyCount = splitDependencies(task.dependencies).length;
  const completion = Number(task.completion || 0);

  if (remainingDays < 0 || (task.priority === "High" && completion < 60 && remainingDays <= 3)) {
    return "Critical";
  }

  if (remainingDays <= 3 || dependencyCount >= 2 || completion < 40) {
    return "High";
  }

  if (remainingDays <= 10 || task.status === "Review") {
    return "Moderate";
  }

  return "Low";
}

export function getRiskTone(risk: string): "neutral" | "info" | "warning" | "success" | "error" {
  if (risk === "Critical") return "error";
  if (risk === "High") return "warning";
  if (risk === "Moderate") return "info";
  return "success";
}

export function getHealthLabelFromScore(score: number) {
  if (score >= 95) return "Excellent";
  if (score >= 85) return "Healthy";
  if (score >= 70) return "Watch";
  return "Critical";
}

export function getHealthToneFromScore(score: number): "neutral" | "info" | "warning" | "success" | "error" {
  if (score >= 95) return "success";
  if (score >= 85) return "info";
  if (score >= 70) return "warning";
  return "error";
}

export function buildMilestoneDescription(task: MilestoneTask) {
  if (task.description?.trim()) {
    return task.description.trim();
  }

  return `${getMilestoneCategory(task)} checkpoint aligned to ${task.projectName} delivery schedule.`;
}

export function splitDependencies(dependencies?: string) {
  if (!dependencies?.trim()) return [];
  return dependencies
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function makeDeliveryScore(task: MilestoneTask) {
  const status = getMilestoneStatus(task);
  const remainingDays = daysUntil(task.dueDate);
  let score = 88;

  if (status === "Completed") score += 10;
  if (status === "Review") score -= 6;
  if (status === "Delayed") score -= 28;
  if (remainingDays <= 3 && status !== "Completed") score -= 8;
  if (task.priority === "High") score -= 4;
  score += Math.round((task.completion || 0) / 10);

  return Math.max(12, Math.min(100, score));
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

