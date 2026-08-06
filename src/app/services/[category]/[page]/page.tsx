import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareerCounsellingContent } from "@/components/career-hub/CareerCounsellingContent";
import { ServicePlaceholder } from "@/components/services/ServicePlaceholder";
import { ServicesLayout } from "@/components/services/ServicesLayout";
import { findServicePage } from "@/lib/services-nav";
import { siteConfig } from "@/lib/constants";

type ServicePageProps = {
  params: Promise<{ category: string; page: string }>;
};

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { category, page } = await params;
  const meta = findServicePage(category, page);
  if (!meta) return { title: siteConfig.name };

  return {
    title: `${meta.link.label} — ${siteConfig.name}`,
    description: meta.subtitle,
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { category, page } = await params;
  const meta = findServicePage(category, page);
  if (!meta) notFound();

  const content =
    category === "career-services" && page === "career-counselling" ? (
      <CareerCounsellingContent />
    ) : (
      <ServicePlaceholder
        title={meta.link.label}
        description={meta.subtitle}
      />
    );

  return (
    <ServicesLayout
      title={meta.link.label}
      subtitle={meta.subtitle}
      categoryId={category}
      activeSlug={page}
    >
      {content}
    </ServicesLayout>
  );
}
