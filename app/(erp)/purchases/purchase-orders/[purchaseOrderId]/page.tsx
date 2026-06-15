import { PurchaseOrderDetailWorkspace } from "@/components/erp/purchases/purchase-order-detail";

interface PageProps {
  params: Promise<{
    purchaseOrderId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { purchaseOrderId } = await params;
  return <PurchaseOrderDetailWorkspace purchaseOrderId={purchaseOrderId} />;
}
