import { FollowUpDetail } from "@/components/erp/follow-ups/follow-up-detail";

interface PageProps {
  params: Promise<{
    followUpId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { followUpId } = await params;
  return <FollowUpDetail leadId={followUpId} />;
}
