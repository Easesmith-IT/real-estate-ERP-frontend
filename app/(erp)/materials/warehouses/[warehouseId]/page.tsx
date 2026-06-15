import { WarehouseDetailWorkspace } from "@/components/erp/warehouse-operations-center";

export default async function Page({ params }: { params: Promise<{ warehouseId: string }> }) {
  const { warehouseId } = await params;

  return <WarehouseDetailWorkspace warehouseId={warehouseId} />;
}
