"use client";

import { ReactNode } from "react";
import { ReactQueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}
