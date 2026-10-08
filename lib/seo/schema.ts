/* JSON-LD builders (schema.org). Used by server components for SEO. */
import { SITE } from "@/config/site";
import type { Faq, Product } from "@/types";

export function organizationJsonLd() {
  return { "@context": "https://schema.org", "@type": "JewelryStore", name: SITE.name, url: SITE.url, address: { "@type": "PostalAddress", addressCountry: "QA" }, currenciesAccepted: "QAR" };
}

export function productJsonLd(p: Product, price: number, inStock: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name.en,
    sku: p.sku,
    description: p.description.en,
    brand: { "@type": "Brand", name: SITE.name },
    material: `${p.metal} ${p.rateId.split("-")[1] ?? ""}`.trim(),
    offers: { "@type": "Offer", priceCurrency: "QAR", price: price.toFixed(2), availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE.url}/product/${p.slug}` },
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE.url}${it.href}` })),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question.en, acceptedAnswer: { "@type": "Answer", text: f.answer.en } })),
  };
}

export function articleJsonLd(title: string, body: string, slug: string) {
  return { "@context": "https://schema.org", "@type": "Article", headline: title, articleBody: body.slice(0, 500), url: `${SITE.url}/pages/${slug}`, publisher: { "@type": "Organization", name: SITE.name } };
}
