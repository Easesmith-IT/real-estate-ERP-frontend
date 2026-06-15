import { notFound } from "next/navigation";
import { SectionOverviewPage, resolveSectionOrNull } from "@/components/erp/section-page";

export default function Page() {
  const section = resolveSectionOrNull("home");
  if (!section) notFound();
  return <SectionOverviewPage section={section} />;
}
