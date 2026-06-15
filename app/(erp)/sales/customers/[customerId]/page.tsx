import { CustomerDetailRoute } from "@/components/erp/customers/customer-detail-route";

interface PageProps {
  params: Promise<{
    customerId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { customerId } = await params;
  return <CustomerDetailRoute customerId={customerId} />;
}
