"use client";

import { use } from "react";
import { TeamDetailWorkspace } from "@/components/erp/people/team-detail-workspace";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  return <TeamDetailWorkspace teamId={resolvedParams.teamId} />;
}
