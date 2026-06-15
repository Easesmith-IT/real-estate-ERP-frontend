import { QuotationDetailWorkspace } from "@/components/erp/quotation-detail";

interface PageProps {
  params: Promise<{
    quotationId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { quotationId } = await params;
  return <QuotationDetailWorkspace quotationId={quotationId} />;
}
