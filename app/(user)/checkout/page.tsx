import type { Metadata } from "next";
import { CheckoutFlow } from "@/user/components/checkout/CheckoutFlow";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
