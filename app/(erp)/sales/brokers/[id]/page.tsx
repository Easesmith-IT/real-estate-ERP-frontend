import { BrokerProfileWorkspace } from "@/components/erp/brokers/broker-profile-workspace";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BrokerProfileWorkspace brokerId={id} />;
}
