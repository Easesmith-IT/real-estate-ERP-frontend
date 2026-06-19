import { getPageBySlug, getSectionBySlug } from "@/lib/navigation";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Card, CardContent } from "@/components/ui/card";

export function EmptySectionPage({ sectionSlug }: { sectionSlug: string }) {
  const section = getSectionBySlug(sectionSlug);

  if (!section) {
    return (
      <section className="space-y-6">
        <SectionHeader
          title="Section Not Found"
          description="The section route exists but has no metadata mapping."
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader title={section.label} description={section.description} />
      <Card className="surface-secondary border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-section-title font-secondary text-text-primary">
            {section.label} Section
          </p>
          <p className="mt-2 text-body text-text-secondary">
            Module division initialized. Use the sidebar menu options to navigate to detail records.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export function EmptyChildPage({
  sectionSlug,
  pageSlug,
}: {
  sectionSlug: string;
  pageSlug: string;
}) {
  const section = getSectionBySlug(sectionSlug);
  const page = getPageBySlug(sectionSlug, pageSlug);

  if (!section || !page) {
    return (
      <section className="space-y-6">
        <SectionHeader
          title="Page Not Found"
          description="The page route exists but has no metadata mapping."
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader title={page.label} description={page.description} />
      <Card className="surface-secondary border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-section-title font-secondary text-text-primary">
            {section.label} / {page.label}
          </p>
          <p className="mt-2 text-body text-text-secondary">
            No Data Available. This module is undergoing configuration.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
