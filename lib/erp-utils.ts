export function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

export function formatDateTime(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
}

export function toneForStage(stage: string): "neutral" | "info" | "warning" | "success" | "error" {
  if (stage === "Closed Won") {
    return "success";
  }

  if (stage === "Closed Lost") {
    return "error";
  }

  if (stage === "Negotiation" || stage === "Booking") {
    return "warning";
  }

  if (stage === "Interested" || stage === "Site Visit Scheduled") {
    return "info";
  }

  return "neutral";
}

export function toneForStatus(status: string): "neutral" | "info" | "warning" | "success" | "error" {
  const normalized = status.toLowerCase();

  if (normalized.includes("complete") || normalized.includes("paid") || normalized.includes("booked") || normalized.includes("active")) {
    return "success";
  }

  if (normalized.includes("overdue") || normalized.includes("lost") || normalized.includes("cancel") || normalized.includes("reject")) {
    return "error";
  }

  if (normalized.includes("pending") || normalized.includes("draft")) {
    return "warning";
  }

  if (normalized.includes("scheduled") || normalized.includes("partial")) {
    return "info";
  }

  return "neutral";
}

export function toneForSeverity(severity: string): "neutral" | "info" | "warning" | "success" | "error" {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") {
    return "error";
  }

  if (normalized === "high") {
    return "warning";
  }

  if (normalized === "medium") {
    return "info";
  }

  if (normalized === "stable") {
    return "success";
  }

  return "neutral";
}

const stageOrder = [
  "New",
  "Contacted",
  "Interested",
  "Site Visit Scheduled",
  "Negotiation",
  "Booking",
  "Closed Won",
  "Closed Lost",
];

export function nextSalesStage(currentStage: string) {
  const index = stageOrder.indexOf(currentStage);
  if (index < 0 || index >= stageOrder.length - 2) {
    return null;
  }

  return stageOrder[index + 1];
}
