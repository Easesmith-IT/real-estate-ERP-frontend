"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/materials/stock-management?tab=CONSUMPTION");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-surface-secondary">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent mx-auto" />
        <p className="text-body text-text-secondary font-medium">Redirecting to Stock Management Command Center...</p>
      </div>
    </div>
  );
}
