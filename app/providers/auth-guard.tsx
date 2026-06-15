"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

const publicPaths = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && pathname === "/login") {
      router.push("/home/dashboard");
      return;
    }
    if (!isAuthenticated && !publicPaths.includes(pathname) && !pathname.startsWith("/_next")) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-app">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary/30 border-t-accent-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
