import { CategoryReportDetailWorkspace } from "@/components/erp/purchases/purchase-reports-details";

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { category } = await params;
  return <CategoryReportDetailWorkspace category={category} />;
}
