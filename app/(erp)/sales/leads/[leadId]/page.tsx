import { LeadDetail } from "@/components/erp/leads/lead-detail";

interface PageProps {
  params: Promise<{
    leadId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { leadId } = await params;
  return <LeadDetail leadId={leadId} />;
}
