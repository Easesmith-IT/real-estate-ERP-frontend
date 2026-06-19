"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const demoAccounts = [
  { id: "user-admin", name: "Aditi Mehra", email: "aditi.mehra@nimbuserp.local", role: "admin" as const, designation: "ERP Administrator" },
  { id: "user-manager", name: "Rohan Malhotra", email: "rohan.malhotra@nimbuserp.local", role: "manager" as const, designation: "Sales Manager" },
  { id: "user-accountant", name: "Neha Suri", email: "neha.suri@nimbuserp.local", role: "accountant" as const, designation: "Finance Controller" },
  { id: "user-sales", name: "Aman Singh", email: "aman.singh@nimbuserp.local", role: "sales" as const, designation: "Sales Executive" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setRole = useUiStore((s) => s.setRole);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (account: (typeof demoAccounts)[0]) => {
    setLoadingId(account.id);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      login(json.data.token, json.data.user);
      setRole(account.role);
      router.push("/home/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary text-white shadow-soft">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-display font-secondary text-text-primary">NimbusOS</h1>
          <p className="mt-1 text-body text-text-muted">Construction ERP Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleLogin(account)}
                disabled={loadingId !== null}
                className="flex w-full items-center gap-4 rounded-xl border border-border-soft bg-surface p-4 text-left transition-all hover:border-accent-primary/40 hover:bg-hover hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-sm font-semibold text-accent-primary">
                  {account.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-text-primary">{account.name}</p>
                  <p className="text-label text-text-muted">{account.designation}</p>
                </div>
                {loadingId === account.id ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent-primary" />
                ) : (
                  <LogIn className="h-5 w-5 shrink-0 text-text-muted" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-body text-error">{error}</p>
        )}

        <p className="text-center text-label text-text-muted">
          Enterprise Access Credentials &mdash; no password required
        </p>
      </div>
    </div>
  );
}
