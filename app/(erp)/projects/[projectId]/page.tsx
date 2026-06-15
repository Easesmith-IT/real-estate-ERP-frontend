import { ProjectDetail } from "@/components/erp/projects/project-detail";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;
  return <ProjectDetail projectId={projectId} />;
}
