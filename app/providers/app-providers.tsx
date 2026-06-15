"use client";

import { ReactNode } from "react";
import { ReactQueryProvider } from "./query-provider";
import { AuthHydrator } from "@/store/auth-hydrator";
import { AuthGuard } from "./auth-guard";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthHydrator>
        <AuthGuard>{children}</AuthGuard>
      </AuthHydrator>
    </ReactQueryProvider>
  );
}
