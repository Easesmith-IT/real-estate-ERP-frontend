"use client";

import { UserRole } from "@/types/navigation";
import type { DocumentRecord } from "@/lib/erp-types";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const demoUserIdByRole: Record<UserRole, string> = {
  admin: "user-admin",
  manager: "user-manager",
  accountant: "user-accountant",
  sales: "user-sales",
};

type ApiRequestOptions = {
  role: UserRole;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
};

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("nimbus-auth");
    if (stored) {
      const { token } = JSON.parse(stored);
      return token || null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions): Promise<ApiEnvelope<T>> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (options.formData) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    headers["Content-Type"] = "application/json";
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      headers["x-demo-user-id"] = demoUserIdByRole[options.role];
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || "GET",
    cache: "no-store",
    headers,
    body: options.formData || (options.body ? JSON.stringify(options.body) : undefined),
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "ERP request failed");
  }

  return payload;
}

export async function uploadDocument(
  role: UserRole,
  file: File,
  metadata: Record<string, string>,
): Promise<ApiEnvelope<DocumentRecord>> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(metadata).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    headers["x-demo-user-id"] = demoUserIdByRole[role];
  }

  const response = await fetch(`${apiBaseUrl}/api/uploads/document`, {
    method: "POST",
    headers,
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Document upload failed");
  }
  return payload;
}
