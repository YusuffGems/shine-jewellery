import type { Metadata } from "next";
import { FaqView } from "@/user/components/content/CmsPageView";

export const metadata: Metadata = { title: "FAQ", alternates: { canonical: "/faq" } };

export default function FaqPage() {
  return <FaqView />;
}
