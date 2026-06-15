import { ProjectReportDetailWorkspace } from "@/components/erp/purchases/purchase-reports-details";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;
  return <ProjectReportDetailWorkspace projectId={projectId} />;
}
