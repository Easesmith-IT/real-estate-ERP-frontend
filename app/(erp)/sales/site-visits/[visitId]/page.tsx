import { SiteVisitDetailWorkspace } from "@/components/erp/site-visits/site-visit-detail-workspace";

interface PageProps {
  params: Promise<{
    visitId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { visitId } = await params;
  return <SiteVisitDetailWorkspace visitId={visitId} />;
}
