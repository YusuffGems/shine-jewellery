"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHydrated } from "@/shared/hooks/useDb";
import { useCustomer } from "@/user/hooks/useShopper";
import { CustomerAuth } from "@/user/components/account/AuthForms";
import { AccountDashboard } from "@/user/components/account/AccountDashboard";

function AccountInner() {
  const hydrated = useHydrated();
  const customer = useCustomer();
  const router = useRouter();
  const next = useSearchParams().get("next");
  if (!hydrated) return <div className="container section" />;
  if (!customer) return <div className="container"><CustomerAuth onDone={() => next?.startsWith("/") && router.push(next)} /></div>;
  return <AccountDashboard customer={customer} />;
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}
