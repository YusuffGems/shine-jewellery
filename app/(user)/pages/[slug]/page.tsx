import type { Metadata } from "next";
import { CmsPageView } from "@/user/components/content/CmsPageView";
import { SEED } from "@/lib/store/seed";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = SEED.cms.pages.find((p) => p.slug === slug);
  return { title: page?.seo.title || page?.title.en || "SHINE", description: page?.seo.description, alternates: { canonical: `/pages/${slug}` } };
}

export default async function CmsPage({ params }: Params) {
  const { slug } = await params;
  return <CmsPageView slug={slug} />;
}
