import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingView } from "@/user/components/listing/ListingView";
import { SEED } from "@/lib/store/seed";

type Params = { params: Promise<{ slug: string }> };

/** Server metadata. Mock mode reads the seed; API mode reads the database here. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const col = SEED.collections.find((c) => c.slug === slug);
  const cat = SEED.categories.find((c) => c.slug === slug);
  const title = col?.seo.title || cat?.name.en || "All Jewellery";
  return {
    title,
    description: col?.seo.description || cat?.description.en || "Gold and diamond jewellery in Qatar.",
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  return (
    <Suspense>
      <ListingView slug={slug} />
    </Suspense>
  );
}
