import { VendorReportDetailWorkspace } from "@/components/erp/purchases/purchase-reports-details";

interface PageProps {
  params: Promise<{
    vendorId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { vendorId } = await params;
  return <VendorReportDetailWorkspace vendorId={vendorId} />;
}
