import { redirect } from "next/navigation";
import { SectionDetailPage, SectionOverviewPage, resolveSectionOrNull } from "@/components/erp/section-page";
import { defaultRoute } from "@/lib/navigation";

export default async function ErpCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const [sectionSlug, pageSlug] = slug;

  if (!sectionSlug) {
    redirect(defaultRoute);
  }

  const section = resolveSectionOrNull(sectionSlug);
  if (!section) {
    redirect(defaultRoute);
  }

  if (!pageSlug) {
    return <SectionOverviewPage section={section} />;
  }

  const page = section.pages.find((item) => item.slug === pageSlug);
  if (!page) {
    redirect(defaultRoute);
  }

  return <SectionDetailPage section={section} page={page} />;
}
