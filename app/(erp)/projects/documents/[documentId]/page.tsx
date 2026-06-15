import { ProjectDocumentDetail } from "@/components/erp/projects/project-document-detail";

interface PageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { documentId } = await params;
  return <ProjectDocumentDetail documentId={documentId} />;
}
