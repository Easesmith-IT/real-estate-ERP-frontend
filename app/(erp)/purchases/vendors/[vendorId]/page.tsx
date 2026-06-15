import { VendorDetailWorkspace } from "@/components/erp/purchases/vendor-detail";

interface PageProps {
  params: Promise<{
    vendorId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { vendorId } = await params;
  return <VendorDetailWorkspace vendorId={vendorId} />;
}
