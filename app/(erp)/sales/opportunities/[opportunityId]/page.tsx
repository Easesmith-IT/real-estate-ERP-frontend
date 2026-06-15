import { OpportunityDetailWorkspace } from "@/components/erp/opportunities/opportunity-detail-workspace";

interface PageProps {
  params: Promise<{
    opportunityId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { opportunityId } = await params;
  return <OpportunityDetailWorkspace opportunityId={opportunityId} />;
}
