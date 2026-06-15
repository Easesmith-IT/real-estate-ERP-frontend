import { RequestDetailWorkspace } from "@/components/erp/purchases/request-detail-workspace";

interface PageProps {
  params: Promise<{
    requestId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { requestId } = await params;
  return <RequestDetailWorkspace requestId={requestId} />;
}
