import { MilestoneDetail } from "@/components/erp/projects/milestone-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ milestoneId: string }>;
}) {
  const { milestoneId } = await params;
  return <MilestoneDetail milestoneId={milestoneId} />;
}
