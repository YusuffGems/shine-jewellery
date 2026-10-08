import type { Metadata } from "next";
import { ProductView } from "@/user/components/product/ProductView";
import { SEED } from "@/lib/store/seed";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = SEED.products.find((x) => x.slug === slug);
  return {
    title: p?.seo.title || p?.name.en || "Product",
    description: p?.seo.description || p?.description.en,
    alternates: { canonical: `/product/${slug}` },
    openGraph: { title: p?.name.en, description: p?.description.en, type: "website" },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
