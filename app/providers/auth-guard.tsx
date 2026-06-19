"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

import { EnterprisePageLoader } from "@/components/ui/loaders";

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
      <div className="flex h-dvh items-center justify-center bg-app p-8">
        <div className="w-full max-w-5xl">
          <EnterprisePageLoader title="Verifying Enterprise Session..." variant="dashboard" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
