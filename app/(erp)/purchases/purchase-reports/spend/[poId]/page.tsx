import { SpendReportDetailWorkspace } from "@/components/erp/purchases/purchase-reports-details";

interface PageProps {
  params: Promise<{
    poId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { poId } = await params;
  return <SpendReportDetailWorkspace poId={poId} />;
}
