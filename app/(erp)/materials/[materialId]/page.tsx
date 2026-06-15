import { MaterialDetail } from "@/components/erp/materials/material-detail";

interface PageProps {
  params: Promise<{
    materialId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { materialId } = await params;
  return <MaterialDetail materialId={materialId} />;
}
